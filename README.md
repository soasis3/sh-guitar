# SG

TONE3000 NAM A2와 캐비넷/공간 IR을 사용하는 웹 기타 리그. 최대 12블록, 드래그 순서 변경, 직렬 및 A/B 스테레오 병렬 경로를 지원합니다. 컴프레서·딜레이는 Web Audio DSP이며 앰프 EQ는 NAM 후단 필터입니다.

## 실행

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

로컬 주소: http://localhost:5173/ . iOS 오디오 입력에는 신뢰할 수 있는 HTTPS가 필요합니다. 설정에서 장치·입력 채널·샘플레이트·입출력 레벨을 조정하고 오디오를 켭니다. 모델과 장치 샘플레이트가 다르면 재생을 거부합니다. 인터페이스 Direct Monitor는 끄고 유선 헤드폰을 사용합니다. 실제 iPhone 인터페이스의 왕복 지연은 별도 측정이 필요합니다.

## TONE3000

설정의 Publishable Key 또는 .env.local의 VITE_TONE3000_CLIENT_ID를 사용합니다. Secret Key는 사용하지 않습니다. OAuth PKCE 토큰은 세션 저장소, 모델과 IR은 사용자 브라우저의 IndexedDB에 저장합니다. 로컬 파일 가져오기 없이 앱 안의 TONE3000 목록에서 선택합니다. 모델 파일을 소스나 배포물에 포함하지 않습니다. API: https://www.tone3000.com/api

## 커뮤니티 기반 프리셋 10개

상단 메뉴에서 선택하면 실제 체인·모델·파라미터 전체가 바뀝니다. 최초 선택 시 인증 다운로드하며, 이번 검증에 사용한 브라우저에는 10개 프리셋의 자산이 준비되어 있습니다. 모든 자산을 준비한 뒤 현재 체인을 교체합니다. 이전 체인은 설정의 복원 버튼으로 되돌릴 수 있습니다. 저장/불러오기는 별도의 사용자 슬롯입니다. 현재 편집 중인 체인을 앱 시작 때 자동으로 덮어쓰지 않습니다.

| 이름 | 조합 |
|---|---|
| Deluxe Glass | 컴프레서 → Fender Deluxe Reverb → Studio 3 룸 |
| Hiwatt Touch | 컴프레서 → Hiwatt T40/20 → 슬랩 에코 → 룸 |
| Super Edge | Fender Super Reverb → 룸 |
| Green Blues | TS9 D3 → Super Reverb → 에코 → 룸 |
| Plexi Crunch | Amalgam JMP-50 Plexi 풀 리그 → 룸 |
| 800 Solo | SD-1 Boost I → Amalgam JCM800 풀 리그 → 에코 → 룸 |
| Jose Orange | 2dor Friedman Jose Hotrod DI → Orange V30 421/M160 → 룸 |
| Ivory Tight | TS9 D0 → APP EVH 5150 III Blue IV → Mesa OS V30 |
| Satan Rhythm | Ola Randall Satan + KSR 풀 리그 → 룸 |
| Wide Afterglow | 컴프레서 → Super Reverb L / Hiwatt R → 에코 → 스테레오 룸 |

근거 링크와 구성은 메뉴 옆 ⓘ에서 볼 수 있습니다. 커뮤니티 추천 캡처·조합 방향을 바탕으로 SG에서 만든 시작 설정이며 원문에 있던 완성 프리셋을 복제한 것은 아닙니다. EQ·레벨·공간계는 SG 설정이고, 청음으로 검증한 추천 순위는 아닙니다. 모델/IR은 제작자 권리를 따릅니다.

- A2 클린 추천: https://www.reddit.com/r/NAM_NeuralAmpModeler/comments/1vrr9nw/whats_your_favorite_a2_clean_captures/
- Amalgam, 2dor Jose, APP EVH, Ola Randall 추천: https://www.reddit.com/r/NAM_NeuralAmpModeler/comments/1wowx0c/lets_all_post_our_favourite_captures/
- TS 전단, 모디파이드 Marshall, Mesa/V30 의견: https://www.reddit.com/r/NAM_NeuralAmpModeler/comments/1licn7f/what_are_your_goto_pedals_cabs_and_irs/

factory-presets.js에 tone/model ID를 명시합니다. 캐비넷 포함 풀 리그에는 IR을 추가하지 않으며, 헤드 모델에는 별도 IR을 연결합니다. 모든 팩토리 세팅은 글로벌 출력 -24 dB에서 시작합니다. 픽업·인터페이스에 따라 입력 및 프리셋 간 음량을 맞추세요.

## 검증

/tests/factory-presets.html: 로그인한 세션에서 버튼을 누르면 10개 실제 모델 다운로드·IR 디코딩·NAM 그래프 생성을 검사합니다. 220 Hz 테스트 신호를 무음 출력으로 처리해 유한하고 0이 아닌 출력을 확인합니다. 2026-10-20 결과 10/10 PASS, 빌드 통과. 음질 청음·실제 기타·iOS 성능 검증을 대체하지 않습니다.

엔진: https://github.com/tone-3000/neural-amp-modeler-wasm (MIT).

## JM 추가 뱅크 (11–14)

존 메이어에서 영감을 받은 SG 프리셋 4개입니다. 모든 프리셋에 활성 컴프레서·딜레이·컨볼루션 리버브를 포함합니다. 원곡/실제 공연 리그를 그대로 재현한 프리셋은 아닙니다. 설명·출처는 ⓘ 팝업에서만 표시합니다.

- JM Velvet Clean: 저게인 Silver Klon → Two-Rock CRS CH1, 짧은 에코와 룸.
- JM Gravity Lead: Klon John Mayer 캡처 → Two-Rock Traditional Clean Gravity 풀 리그.
- JM Slow Dance: Marshall Blues Breaker G2 T4 → Two-Rock CRS CH1, 360 ms 에코.
- JM Belief Drive: Continuum TS10 스타일 캡처 → Silver Klon → Two-Rock CRS CH1, 380 ms 에코.

투락 캡처는 모두 캐비넷 포함이며 별도 캐비넷을 추가하지 않습니다. Gravity 팩의 리드 게인과 외장 드라이브가 겹치므로 클론 출력과 앰프 입력을 낮췄습니다. 컴프·딜레이·리버브와 EQ는 SG 시작값입니다.

출처: https://www.tapatalk.com/groups/johnmayer/pedalboard-signal-chain-t14572.html 및 https://www.musicradar.com/news/john-mayers-2019-pedalboard-has-been-revealed . 서로 다른 시기 보드에는 페달 순서가 다를 수 있습니다. Belief Drive는 후자의 TS10 → Klon 순서를 참고했습니다. 모델 근거는 TONE3000 tone 99695, 78019, 2599, 5196, 80502, 99122의 제작자 설명입니다.

검증: /tests/factory-presets.html?bank=mayer 에서 4/4 실제 다운로드·NAM DSP 무음 출력 검사 통과. 전체 뱅크는 총 14개이며 테스트 합계는 데이터 개수를 따릅니다. 실제 기타 청음과 iOS 장치 성능은 미검증입니다.

## GitHub Pages hosting

The GitHub Actions workflow builds and publishes dist on pushes to main. Vite uses relative asset URLs so the NAM worklet and WASM also load under the repository path. Set repository variable VITE_TONE3000_CLIENT_ID to the TONE3000 publishable client ID (never a Secret Key). Enable Pages with GitHub Actions as the source.

TONE3000 OAuth uses the deployed page URL as its redirect URI. If the TONE3000 API key has redirect restrictions, add that HTTPS URL in TONE3000 Settings. Each device signs in separately and downloads models into its own browser cache. Localhost models and saved rigs do not automatically transfer to iPad.
