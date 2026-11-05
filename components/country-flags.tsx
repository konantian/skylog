import countries from '@/data/country-flags.json';

export function CountryFlags({country, size = 24}: {country?: string; size?: number}) {
  const codes = (countries as Record<string, string[]>)[country || ''] || [];
  if (!codes.length) return null;
  return <span className="country-flags" aria-hidden="true">
    {codes.map(code => <img key={code} src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/flags/${code}.svg`} alt="" width={size} height={size * 0.75} style={{width:size,height:size * 0.75}} loading="lazy"/>)}
  </span>;
}
