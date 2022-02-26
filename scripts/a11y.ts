import pa11y from 'pa11y';
import { urls } from './utils';

// TODO: Make it work with the shadow dom.

runExample();

async function runExample() {
  try {
    const results = await Promise.all(urls.map((url) => pa11y(url)));

    results.forEach((result) => {
      if (result.issues.length) {
        console.log(`${result.issues.length} a11y issues found on ${result.pageUrl}.`);
        console.log(result.issues);
        process.exitCode = 1;
      } else {
        console.log(`No a11y issues found on ${result.pageUrl}.`);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unexpected error running pa11y', error);
    }
    process.exitCode = 1;
  }
}
