# LottoLog-draws

로또 6/45 회차별 당첨 번호·등수별 상금을 담은 `draws.json`. 로또북 앱이 GitHub Pages 에서 읽는다.

- URL: https://lottolog.github.io/LottoLog-draws/draws.json
- 형식: 회차 오름차순 배열, 한 줄에 한 회차. `{ drwNo, drawnAt, numbers(오름차순 6개), bonus, prizes: [{ rank, amount, count }] × 5 }`
- 갱신: `sync.yml` 이 매주 토 21:30 KST(재시도 일 09:17 KST)에 동행복권에서 다음 회차를 받아 커밋하고 Pages 에 배포
- 수동: `node sync.mjs`(Node 24) 또는 Actions 의 `workflow_dispatch`
