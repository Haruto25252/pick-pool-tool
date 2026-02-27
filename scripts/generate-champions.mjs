import https from 'https';

https.get('https://ddragon.leagueoflegends.com/cdn/16.4.1/data/ja_JP/champion.json', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const entries = Object.entries(json.data).map(([id, champ]) => {
      return `  '${champ.name}': '${id}'`;
    });
    console.log(entries.join(',\n'));
  });
});
