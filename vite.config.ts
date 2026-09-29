import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base를 './'로 두는 이유: 블로그의 /game/log/ 같은 하위 경로에 그대로 올려도 에셋 경로가 깨지지 않게 하려는 것이다.
// `--mode single`은 모든 에셋을 HTML 한 파일에 인라인한 미리보기용 빌드다.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
}));
