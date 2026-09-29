#!/usr/bin/env bash
# 빌드 결과를 블로그 저장소의 게임 탭 경로로 복사한다.
# 사용: ./scripts/deploy-to-blog.sh ../noah2byte.github.io game/log
set -euo pipefail
BLOG_DIR="${1:?블로그 저장소 경로}"
TARGET="${2:-game/log}"
npm run build
rm -rf "$BLOG_DIR/$TARGET"
mkdir -p "$BLOG_DIR/$TARGET"
cp -r dist/. "$BLOG_DIR/$TARGET/"
echo "복사 완료: $BLOG_DIR/$TARGET  (커밋 후 푸시하면 GitHub Pages에 반영된다)"
