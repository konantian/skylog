const manufacturers = {
  Airbus: "空客",
  Boeing: "波音",
  ATR: "ATR",
  Antonov: "安东诺夫",
  Beechcraft: "比奇",
  Bombardier: "庞巴迪",
  Cessna: "塞斯纳",
  "De Havilland Canada": "加拿大德哈维兰",
  Embraer: "巴航工业",
  Gulfstream: "湾流",
  "McDonnell Douglas": "麦道",
  Saab: "萨博",
};

export function aircraftName(name, locale) {
  if (locale !== "zh") return name;
  for (const [english, chinese] of Object.entries(manufacturers)) {
    if (name === english || name.startsWith(`${english} `))
      return chinese + name.slice(english.length);
  }
  return name;
}

// Normalize only search input; keep canonical model names in records and filters.
export function aircraftSearchQuery(value) {
  let query = String(value ?? "").normalize("NFKC").trim();
  for (const [english, chinese] of Object.entries(manufacturers)) {
    if (chinese !== english && query.startsWith(chinese)) {
      query = english + query.slice(chinese.length);
      break;
    }
  }
  return query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}
