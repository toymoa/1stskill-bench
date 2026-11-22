# 1stskill 벤치마크 러너

[English](README.md) · 한국어

[1stskill](https://1stskill.com) GA 벤치마크용 공개 러너입니다. 참가자 본인의 API 키로
GitHub Actions에서 Claude Code 또는 Codex CLI를 실행해 공개 코딩 과제 10개를 풀고, 과제별
변경분(patch)을 제출합니다. 채점은 1stskill 서버가 운영자 평가와 같은 채점기로 하며, 이
저장소는 채점하지 않습니다.

## 참여 방법

1. https://1stskill.com 에 공개 스킬 저장소를 등록합니다.
2. [template/1stskill.yml](template/1stskill.yml)을 자기 저장소의 `.github/workflows/`에
   복사합니다. `account`에 1stskill.com 닉네임을 적고(스킬이 저장소 루트에 없으면
   `skill-path`도), `uses:` 줄의 고정된 러너 커밋은 그대로 둡니다. secret을 하나 추가합니다:
   `ANTHROPIC_API_KEY` 또는 `OPENAI_API_KEY`.
3. 자기 저장소의 Actions 탭에서 workflow를 실행하고 `claude` 또는 `codex`를 고릅니다.

다른 설정은 없습니다. workflow가 최신 CLI 설치, 과제 실행, 결과 파일 서명, 제출까지 합니다.

## 결과와 뱃지

- 사이트가 받아들인 서명된 결과에는 `GA`(GitHub Attested) 뱃지가 붙습니다. 서명에는 이
  workflow와 그 커밋, 스킬 저장소가 기록됩니다. 결과는 결과 파일에 적힌 `account`에만
  기록되고, 그 계정이 같은 스킬 내용으로 이 저장소를 등록한 경우에만 인정됩니다. 저장소에
  쓰기 권한이 있는 사람만 workflow를 실행할 수 있으므로 다른 사람이 결과를 가져갈 수 없습니다.
- `OV`(Official Verified)는 운영자가 같은 공개 조건으로 직접 다시 실행한 결과입니다.
- 점수는 기준선 대비가 아닌 절대 점수입니다. 다시 실행하면 표시 결과가 바뀌고, 이전 결과는
  이력으로 남습니다.
- 결과 파일 `1stskill-result.json`(스키마 `1stskill.ga-result/1`)에는 CLI 버전, 과제별 트리
  해시가 포함된 suite 버전, 토큰 사용량, 과제별 변경분이 들어갑니다. 러너는 변경분만 보내고
  판정은 보내지 않습니다.

## 로컬 실행

Node.js 24와 CLI 하나(`npm install -g @anthropic-ai/claude-code` 또는
`npm install -g @openai/codex`)를 설치하고, 제공자 키를 환경변수에 넣은 뒤 실행합니다.

```sh
node bin/run.mjs --cli claude --model <model id> --skill ./path/to/skill --out result.json
```

`--skill`은 `SKILL.md`가 있는 폴더입니다. 사이트가 가져오는 것과 같게 그 안의 Markdown과
LICENSE 파일만 설치합니다. `--model`을 생략하면 CLI 기본값을 씁니다. 로컬 실행은 커밋 정보가
자리표시자로 기록되므로 제출하면 안 됩니다.

## 확인 필요 항목

실제 Actions 실행으로 아직 확인하지 않은 항목은 [README.md](README.md#verification-items)의
Verification items에 영어로 정리되어 있습니다.
