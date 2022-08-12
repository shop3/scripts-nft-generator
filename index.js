import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const fileRefs = fs.readdirSync('./scripts')
const files = fileRefs.map(fileRef => fs.readFileSync('./scripts/' + fileRef).toString())

const compiler = webpack({
  mode: 'development',
  entry: {
    app: './editor.js',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
  },
  output: {
    path: path.resolve(process.cwd(), './dist'),
    filename: '[name].bundle.js',
    globalObject: 'self',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      excludeChunks: ['editor.worker', 'json.worker', 'css.worker', 'html.worker', 'ts.worker']
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ttf$/,
        use: ['file-loader']
      }
    ]
  }
})

const server = new WebpackDevServer({
  // open: true,
  hot: true,
  setupExitSignals: true,
}, compiler)

const runServer = async () => {
  await server.start();
  (async () => {
    const browser = await puppeteer.launch({
      // headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 400,
      height: 400
    })
    await page.goto('http://localhost:8080');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await page.evaluate((file) => {
        window.monaco.setValue(file);
      }, file);
      await page.waitForTimeout(1000)
      await page.screenshot({ path: './images/' + i + '.png' });
    }

    await browser.close();
    process.exit(1)
  })();
};

runServer();

