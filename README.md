# 사분면 스튜디오 — GitHub Pages 버전

이 폴더는 별도의 서버나 빌드 과정 없이 GitHub Pages에서 바로 실행되는 정적 버전입니다.

## 올리는 방법

1. GitHub에서 새 저장소를 만듭니다.
2. 이 `for github` 폴더 **안에 있는 파일들**을 저장소 최상위 위치에 올립니다.
3. 저장소의 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
5. 브랜치는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
6. 잠시 후 표시되는 GitHub Pages 주소로 접속합니다.

## 반드시 함께 올릴 파일

- `index.html`
- `styles.css`
- `app.js`
- `.nojekyll`

`README.md`는 사용 안내이므로 함께 올리는 것을 권장합니다.

## 저장 방식

이미지와 편집 내용은 서버에 전송되지 않습니다. 작업을 보관하려면 화면의 `편집 파일 저장`을 사용하고, 나중에 `편집 파일 불러오기`로 복원하세요.
