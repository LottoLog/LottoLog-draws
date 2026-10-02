// 동행복권에서 draws.json 마지막 회차 다음부터 빈 응답이 올 때까지 받아 덧붙인다. Node 24, 의존성 없음.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('./draws.json', import.meta.url);
const URL_BASE = 'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=';

/** 동행복권은 연속 요청 중 간헐적으로 연결을 안 받는다. 2·4·8·16초 쉬고 다시 */
async function retry(fn, wait = 2000) {
  try {
    return await fn();
  } catch (e) {
    if (wait > 16000) throw e;
    await new Promise((r) => setTimeout(r, wait));
    return retry(fn, wait * 2);
  }
}

/** 추첨 전이거나 상금 미확정이면 null */
async function fetchDraw(no) {
  const res = await retry(() => fetch(URL_BASE + no));
  if (!res.ok) throw new Error(`${no}: HTTP ${res.status}`);
  const i = (await res.json())?.data?.list?.[0];
  // 파라미터가 무시되면 최신 회차가 오므로 요청한 회차가 아니면 없는 것으로 본다
  if (!i || i.ltEpsd !== no) return null;
  if (i.rnk1WnNope > 0 && i.rnk1WnAmt === 0) return null;
  const d = i.ltRflYmd;
  return {
    drwNo: no,
    drawnAt: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    numbers: [i.tm1WnNo, i.tm2WnNo, i.tm3WnNo, i.tm4WnNo, i.tm5WnNo, i.tm6WnNo].sort((a, b) => a - b),
    bonus: i.bnsWnNo,
    prizes: [1, 2, 3, 4, 5].map((r) => ({ rank: r, amount: i[`rnk${r}WnAmt`], count: i[`rnk${r}WnNope`] })),
  };
}

const draws = JSON.parse(await readFile(FILE, 'utf8').catch(() => '[]'));
let added = 0;
try {
  for (let no = (draws.at(-1)?.drwNo ?? 0) + 1; ; no++) {
    const draw = await fetchDraw(no);
    if (!draw) break;
    draws.push(draw);
    added++;
    await new Promise((r) => setTimeout(r, 100));
  }
} finally {
  // 실패해도 받은 데까지 저장해 다음 실행이 이어 받는다. 한 줄에 한 회차라 매주 diff 가 한 줄씩 는다
  await writeFile(FILE, `[\n${draws.map((d) => JSON.stringify(d)).join(',\n')}\n]\n`);
  console.log(`added ${added}, latest ${draws.at(-1)?.drwNo}`);
}
