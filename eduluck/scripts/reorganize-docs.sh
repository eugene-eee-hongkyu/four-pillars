#!/usr/bin/env bash
# eduluck/ 안 .md 파일을 docs/ 하위 카테고리 폴더로 정리.
# git mv로 history 보존 + sed로 cross-ref 일괄 갱신.
set -e
cd "$(dirname "$0")/.."

mkdir -p docs/plan docs/build docs/design docs/reports

# 1. 이동 (git mv) — eduluck_ prefix 제거 + 카테고리 폴더
git mv SETUP.md docs/SETUP.md
git mv COMPLETION_REPORT.md docs/reports/COMPLETION_REPORT.md
git mv PHASE_7_REPORT.md docs/reports/PHASE_7_REPORT.md

git mv docs/eduluck_A-0_v3.md docs/plan/A-0_v3.md
git mv docs/eduluck_A-1_v4.md docs/plan/A-1_v4.md
git mv docs/eduluck_A-2_v2.md docs/plan/A-2_v2.md
git mv docs/eduluck_A-3a_v1.md docs/plan/A-3a_v1.md
git mv docs/eduluck_A-3b_v1.md docs/plan/A-3b_v1.md

git mv docs/eduluck_B-1_v1.md docs/build/B-1_v1.md
git mv docs/eduluck_B-1_v2.md docs/build/B-1_v2.md
git mv docs/eduluck_handoff_README.md docs/build/handoff_README.md

git mv docs/eduluck_DESIGN_v1.1.md docs/design/DESIGN_v1.1.md
git mv docs/DESIGN_UX_REVIEW.md docs/design/DESIGN_UX_REVIEW.md

# 2. 중복 삭제 (ref/에 동일 파일)
git rm "docs/08_가이드_Claude_Design과_Stitch_v1_1.md"

# 3. cross-ref 일괄 갱신 (절대경로 기준)
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.expo/*" -not -path "*/docs/ref/*" -print0 \
  | xargs -0 sed -i '' \
    -e 's|eduluck/docs/eduluck_A-0_v3\.md|eduluck/docs/plan/A-0_v3.md|g' \
    -e 's|eduluck/docs/eduluck_A-1_v4\.md|eduluck/docs/plan/A-1_v4.md|g' \
    -e 's|eduluck/docs/eduluck_A-2_v2\.md|eduluck/docs/plan/A-2_v2.md|g' \
    -e 's|eduluck/docs/eduluck_A-3a_v1\.md|eduluck/docs/plan/A-3a_v1.md|g' \
    -e 's|eduluck/docs/eduluck_A-3b_v1\.md|eduluck/docs/plan/A-3b_v1.md|g' \
    -e 's|eduluck/docs/eduluck_B-1_v1\.md|eduluck/docs/build/B-1_v1.md|g' \
    -e 's|eduluck/docs/eduluck_B-1_v2\.md|eduluck/docs/build/B-1_v2.md|g' \
    -e 's|eduluck/docs/eduluck_DESIGN_v1\.1\.md|eduluck/docs/design/DESIGN_v1.1.md|g' \
    -e 's|eduluck/docs/eduluck_handoff_README\.md|eduluck/docs/build/handoff_README.md|g' \
    -e 's|eduluck/docs/DESIGN_UX_REVIEW\.md|eduluck/docs/design/DESIGN_UX_REVIEW.md|g' \
    -e 's|eduluck/SETUP\.md|eduluck/docs/SETUP.md|g' \
    -e 's|eduluck/COMPLETION_REPORT\.md|eduluck/docs/reports/COMPLETION_REPORT.md|g' \
    -e 's|eduluck/PHASE_7_REPORT\.md|eduluck/docs/reports/PHASE_7_REPORT.md|g'

echo "✓ docs 재구성 완료"
echo ""
echo "남은 작업:"
echo "  - 루트 README.md 신규 작성"
echo "  - 남은 깨진 link 수동 확인: grep -rn 'eduluck_[A-Z]' docs/"
