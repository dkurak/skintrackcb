/**
 * Analyze existing forecast data to populate trend and key_message fields
 * Run with: node analyze_forecasts.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://laqztrcpphepuqjthilu.supabase.co',
  'sb_publishable_6VXTlj3scweQv75lZ7AhqA_kDKc7sfY'
);

// Keywords for sentiment/trend analysis
const WORSENING_KEYWORDS = [
  'increasing', 'rising', 'storm', 'loading', 'incoming', 'developing',
  'widespread', 'very likely', 'almost certain', 'avoid', 'dangerous',
  'critical', 'heightened', 'elevated', 'significant', 'new snow',
  'fresh snow', 'accumulation'
];

const IMPROVING_KEYWORDS = [
  'decreasing', 'improving', 'settling', 'stabilizing', 'bonding',
  'less likely', 'isolated', 'reduced', 'favorable', 'adjusting',
  'equilibrium', 'stubborn', 'unlikely'
];

const STEADY_KEYWORDS = [
  'similar', 'unchanged', 'persistent', 'continues', 'remains',
  'same as', 'little change', 'consistent'
];

/**
 * Analyze text to determine trend
 */
function analyzeTrend(text) {
  const textLower = text.toLowerCase();

  let worseningCount = WORSENING_KEYWORDS.filter(kw => textLower.includes(kw)).length;
  let improvingCount = IMPROVING_KEYWORDS.filter(kw => textLower.includes(kw)).length;
  let steadyCount = STEADY_KEYWORDS.filter(kw => textLower.includes(kw)).length;

  // Check for storm indicators
  const hasStormIndicator = textLower.includes('storm') ||
    textLower.includes('incoming') ||
    textLower.includes('new snow expected');

  if (hasStormIndicator && worseningCount > 0) {
    return 'storm_incoming';
  } else if (worseningCount > improvingCount + 2) {
    return 'worsening';
  } else if (improvingCount > worseningCount + 2) {
    return 'improving';
  } else {
    return 'steady';
  }
}

/**
 * Extract key message from text
 */
function extractKeyMessage(bottomLine, discussion) {
  const text = bottomLine + ' ' + (discussion || '');
  const sentences = text.split(/[.!]/).filter(s => s.trim().length > 15);

  // Critical patterns to look for
  const criticalPatterns = [
    /avoid\s+\w+/i,
    /stay\s+(below|under|off|away)/i,
    /do\s+not/i,
    /give\s+yourself\s+.*margin/i,
    /safest.*terrain/i,
    /best\s+(riding|snow|conditions)/i,
    /reduce\s+your\s+exposure/i,
  ];

  // Look for sentences with critical patterns
  for (const sentence of sentences) {
    for (const pattern of criticalPatterns) {
      if (pattern.test(sentence)) {
        return sentence.trim();
      }
    }
  }

  // If no critical pattern, return first meaningful sentence
  for (const sentence of sentences) {
    if (sentence.trim().length > 30) {
      return sentence.trim();
    }
  }

  return null;
}

/**
 * Generate travel advice from bottom line if not present
 */
function generateTravelAdvice(bottomLine, discussion) {
  const text = bottomLine + ' ' + (discussion || '');
  const sentences = text.split(/[.!]/).filter(s => s.trim().length > 10);

  // Look for travel-related recommendations
  const travelPatterns = [
    /safest.*terrain/i,
    /best.*riding/i,
    /wind.protected/i,
    /lower elevation/i,
    /avoid.*slopes/i,
    /reduce.*exposure/i,
  ];

  for (const sentence of sentences) {
    for (const pattern of travelPatterns) {
      if (pattern.test(sentence)) {
        return sentence.trim();
      }
    }
  }

  return null;
}

async function analyzeAndUpdate() {
  console.log('Fetching forecasts...\n');

  // Get all forecasts that need analysis
  const { data: forecasts, error } = await supabase
    .from('forecasts')
    .select('id, valid_date, zone_id, bottom_line, discussion, trend, key_message, travel_advice')
    .order('valid_date', { ascending: false });

  if (error) {
    console.error('Error fetching forecasts:', error);
    return;
  }

  console.log(`Found ${forecasts.length} forecasts to analyze\n`);

  let updated = 0;
  for (const forecast of forecasts) {
    const combinedText = `${forecast.bottom_line || ''} ${forecast.discussion || ''}`;

    if (!combinedText.trim()) {
      console.log(`Skipping ${forecast.valid_date} ${forecast.zone_id} - no content`);
      continue;
    }

    const trend = analyzeTrend(combinedText);
    const keyMessage = extractKeyMessage(forecast.bottom_line || '', forecast.discussion || '');
    const travelAdvice = forecast.travel_advice || generateTravelAdvice(forecast.bottom_line || '', forecast.discussion || '');

    // Only update if values are different
    if (trend !== forecast.trend || keyMessage !== forecast.key_message || travelAdvice !== forecast.travel_advice) {
      const { error: updateError } = await supabase
        .from('forecasts')
        .update({
          trend,
          key_message: keyMessage,
          travel_advice: travelAdvice
        })
        .eq('id', forecast.id);

      if (updateError) {
        console.error(`Error updating ${forecast.valid_date} ${forecast.zone_id}:`, updateError);
      } else {
        updated++;
        console.log(`Updated ${forecast.valid_date} ${forecast.zone_id}:`);
        console.log(`  Trend: ${trend}`);
        console.log(`  Key Message: ${keyMessage?.substring(0, 60)}...`);
        console.log(`  Travel Advice: ${travelAdvice?.substring(0, 60)}...\n`);
      }
    } else {
      console.log(`${forecast.valid_date} ${forecast.zone_id} - already up to date`);
    }
  }

  console.log(`\nDone! Updated ${updated} forecasts.`);
}

analyzeAndUpdate().catch(console.error);
