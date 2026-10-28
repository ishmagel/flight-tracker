import SplitFlapText from './SplitFlapText';
import UserAvatar    from './UserAvatar';
import BreweryLogo   from './BreweryLogo';
import './UntappdRow.css';

const STYLE_MAP = [
  [/DOUBLE IPA|IMPERIAL IPA|DIPA/i,         'DIPA  '],
  [/HAZY IPA|NEW ENGLAND|NEIPA/i,           'NEIPA '],
  [/IPA/i,                                  'IPA   '],
  [/IMPERIAL STOUT/i,                       'IMPSTO'],
  [/OATMEAL STOUT/i,                        'OATSTOUT'.slice(0,6)],
  [/STOUT/i,                                'STOUT '],
  [/PORTER/i,                               'PORTER'],
  [/SOUR/i,                                 'SOUR  '],
  [/PILSNER|PILSENER/i,                     'PILSNR'],
  [/WHEAT|WEIZEN|WITBIER/i,                 'WHEAT '],
  [/PALE ALE|APA/i,                         'PALE  '],
  [/LAGER/i,                                'LAGER '],
  [/AMBER/i,                                'AMBER '],
  [/BROWN ALE/i,                            'BROWN '],
  [/SAISON/i,                               'SAISON'],
  [/BARLEYWINE/i,                           'BRLYWN'],
  [/SESSION/i,                              'SESSN '],
  [/KOLSCH|KÖLSCH/i,                        'KOLSCH'],
  [/HEFEWEIZEN/i,                           'HEFE  '],
];

function abbreviateStyle(style = '') {
  for (const [re, abbr] of STYLE_MAP) {
    if (re.test(style)) return abbr;
  }
  return style.slice(0, 6).toUpperCase().padEnd(6);
}

function formatBeerName(name = '') {
  return name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 10).padEnd(10);
}

function formatVenue(venue) {
  if (!venue?.venue_name) return '???     ';
  if (/untappd at home/i.test(venue.venue_name)) return 'HOME    ';
  return venue.venue_name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8).padEnd(8);
}

export default function UntappdRow({ checkin }) {
  const { beer, brewery, user, venue } = checkin;
  const beerName  = formatBeerName(beer?.beer_name ?? '?');
  const venueName = formatVenue(venue);

  return (
    <div className="untappd-row" style={{ '--row-accent': '#F5A623' }}>

      <div className="col-direction">
        <UserAvatar user={user} size={36} />
      </div>

      <div className="col-logo">
        <BreweryLogo
          logoUrl={brewery?.brewery_label}
          name={brewery?.brewery_name}
        />
      </div>

      <div className="col-flight">
        <SplitFlapText text={beerName} />
      </div>

      <div className="col-venue">
        <SplitFlapText text={venueName} />
      </div>

    </div>
  );
}
