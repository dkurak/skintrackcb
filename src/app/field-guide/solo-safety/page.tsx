import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Solo Safety & Trip Planning',
  description: 'Essential safety practices for solo backcountry travel. Trip planning, the buddy system, and what to do when you go alone.',
};

export default function SoloSafetyPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/field-guide" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          &larr; Field Guide
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Solo Safety &amp; Trip Planning</h1>
        <p className="text-gray-600 mt-1">
          The backcountry doesn&apos;t care about your experience level. Planning and partners save lives.
        </p>
      </div>

      {/* The #1 Rule */}
      <section className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-900 mb-3">Rule #1: Don&apos;t Go Alone</h2>
        <div className="space-y-3 text-sm text-red-800">
          <p>
            This is the single most important rule in backcountry travel. A partner is not just company &mdash;
            they are your rescue team, your second set of eyes on hazards, and the person who calls for help
            if something goes wrong.
          </p>
          <p>
            Consider what happens when you&apos;re solo and something goes sideways: a twisted knee in a drainage
            with no cell service, a tree well on a powder day, a vehicle stuck 20 miles from pavement.
            With a partner, these are problems. Alone, they can become emergencies.
          </p>
          <p className="font-semibold">
            Every year, experienced people die in the backcountry because they were alone when something
            went wrong that would have been survivable with a partner.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href="/trips"
            className="inline-block px-5 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
          >
            Find a Crew for Your Next Trip
          </Link>
        </div>
      </section>

      {/* Why Partners Matter */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Partners Matter</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">Avalanche Rescue</h3>
              <p>
                Companion rescue is the only realistic chance of survival in an avalanche burial.
                Organized rescue takes too long &mdash; survival drops below 50% after 15 minutes.
                Your partner is your lifeline.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Injury Response</h3>
              <p>
                A broken leg, a concussion, a dislocated shoulder &mdash; manageable with a partner who can
                stabilize you and go for help. Alone, you&apos;re crawling or waiting and hoping.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">Decision Making</h3>
              <p>
                Summit fever, fatigue, and target fixation cloud judgment. A partner provides a check
                on risky decisions. Two heads evaluating avalanche conditions, weather changes, or
                route choices are better than one.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Vehicle Recovery</h3>
              <p>
                Two vehicles on a backcountry road means you always have a tow option.
                Solo on a muddy pass with no cell service is a long walk or an expensive helicopter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Planning - Always */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Trip Planning: Every Time, No Exceptions</h2>
        <p className="text-sm text-gray-600 mb-4">
          Whether you&apos;re going with a group or heading out solo, these steps are non-negotiable.
        </p>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <strong>Tell someone your plan.</strong> Before you leave, tell a trusted person who is NOT on the trip:
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                <li>Where you&apos;re going (trailhead, route, zone)</li>
                <li>When you&apos;re leaving and when you expect to return</li>
                <li>Who you&apos;re going with (or that you&apos;re solo)</li>
                <li>What vehicle you&apos;re driving and where it will be parked</li>
                <li>When they should worry and who to call</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <strong>Check conditions before you go.</strong> Review the{' '}
              <Link href="/forecast" className="text-blue-600 hover:underline">avalanche forecast</Link>{' '}
              (winter), weather forecast, and road conditions. Adjust your plan based on what you find, not what you hoped for.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <strong>Set a turnaround time.</strong> Decide before you leave when you&apos;ll turn around regardless of
              where you are. Stick to it. Most accidents happen to tired people pushing past their limits late in the day.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <strong>Check in when you&apos;re back.</strong> Text your contact person when you return. If you don&apos;t,
              they know something is wrong and can initiate a search.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</span>
            <div>
              <strong>If plans change, communicate.</strong> Taking a different route? Running late? Send a satellite message
              or call from the trailhead if you have service. A search triggered by a missed check-in wastes resources
              and terrifies your people.
            </div>
          </div>
        </div>
      </section>

      {/* If You Go Solo Anyway */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">If You Go Solo Anyway</h2>
        <p className="text-sm text-gray-600 mb-4">
          We get it &mdash; sometimes schedules don&apos;t align and you&apos;re going regardless. If you choose to go alone,
          raise your safety margin significantly.
        </p>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>A{' '}
              <Link href="/field-guide/satellite-sos" className="text-blue-600 hover:underline">satellite communicator</Link>{' '}
              is non-negotiable.</strong> No exceptions. An iPhone is not enough.
              Carry a Garmin inReach, SPOT, or PLB.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Dial back the objective.</strong> Solo is not the time for your hardest line, the most remote zone,
              or the sketchiest road. Pick terrain well within your ability. Leave the ambitious stuff for when you have partners.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Avoid avalanche terrain entirely when solo.</strong> There is no companion rescue if you&apos;re buried alone.
              Your beacon, probe, and shovel are useless without someone to operate them.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Carry a{' '}
              <Link href="/field-guide/radio-channels" className="text-blue-600 hover:underline">radio</Link>.</strong>{' '}
              You might not have a partner, but other groups in the area might be on channel 20.
              It&apos;s a slim backup, but it&apos;s something.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Send tracking check-ins.</strong> If your satellite device supports tracking (inReach, SPOT),
              turn it on. Your emergency contact can see where you are in real time. Set it to send
              automatic location pings every 10-30 minutes.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Extra margin on everything.</strong> More food, more water, more layers, earlier turnaround time.
              Solo means no one is sharing their extra anything with you.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">&#x2022;</span>
            <span>
              <strong>Stick to popular areas.</strong> More people around means a better chance someone notices
              if something goes wrong. A busy trailhead is safer than an empty one.
            </span>
          </div>
        </div>
      </section>

      {/* What Your Emergency Contact Needs */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">What Your Emergency Contact Needs to Know</h2>
        <p className="text-sm text-gray-600 mb-4">
          Your emergency contact is your safety net. Give them what they need to help you if something goes wrong.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
          <p><strong>Share before every trip:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Your planned route and destination</li>
            <li>Trailhead name and parking location</li>
            <li>Vehicle description and license plate</li>
            <li>Expected departure and return times</li>
            <li>Names and contact info for anyone you&apos;re going with</li>
            <li>Your satellite device brand and tracking link (if applicable)</li>
          </ul>
          <p className="mt-3"><strong>Tell them the trigger:</strong></p>
          <p className="text-gray-600">
            &quot;If you haven&apos;t heard from me by [time], call Gunnison County dispatch at 911 and tell them
            I was heading to [location] and was expected back by [time].&quot;
          </p>
          <p className="text-gray-600 mt-2">
            Be specific. &quot;Sunday night&quot; is too vague. &quot;Sunday by 6 PM, call at 8 PM if no word&quot; is actionable.
          </p>
        </div>
      </section>

      {/* Trip Plan Template */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Trip Plan</h2>
        <p className="text-sm text-gray-600 mb-4">
          Copy this, fill it in, and text it to your emergency contact before you leave. It takes 2 minutes.
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono space-y-1">
          <p>Heading to: _______________</p>
          <p>Trailhead: _______________</p>
          <p>Route/plan: _______________</p>
          <p>Going with: _______________ (or solo)</p>
          <p>Leaving at: _______________</p>
          <p>Back by: _______________</p>
          <p>Vehicle: _______________ (plate: ___)</p>
          <p>If no word by: ___ call 911</p>
          <p>Sat device: yes / no &nbsp; Tracking link: ___</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Better With a Crew</h2>
        <p className="text-sm text-blue-800 mb-4">
          The easiest way to stay safe is to not go alone. Browse upcoming trips or post your own
          to find partners heading the same direction.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/trips"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Trips
          </Link>
          <Link
            href="/trips/new"
            className="px-5 py-2.5 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Post a Trip
          </Link>
        </div>
      </section>
    </div>
  );
}
