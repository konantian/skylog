import { flightAirlineLogo } from '@/lib/flight-airline-logo';

export function FlightAirlineMark({airline}: {airline: string}) {
  const logo = flightAirlineLogo(airline);
  return logo ? <img className="flight-airline-mark" src={logo.image.src} data-reverse={logo.reverseOnDark || undefined} alt="" width={26} height={26} loading="lazy"/> : null;
}
