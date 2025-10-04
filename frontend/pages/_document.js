import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Suppress hydration warnings for browser extensions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extensions
              const originalError = console.error;
              console.error = function(...args) {
                if (
                  typeof args[0] === 'string' &&
                  (args[0].includes('data-new-gr-c-s-check-loaded') ||
                   args[0].includes('data-gr-ext-installed') ||
                   args[0].includes('Extra attributes from the server'))
                ) {
                  return;
                }
                originalError.apply(console, args);
              };
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
