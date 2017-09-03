const _ = require('lodash');
const NLP = require('./index');
const readline = require('readline');
const fs = require('fs');

const testTargets = [
  {
    title: 'weather',
    keywords: [
      {
        word: 'meteorology',
        type: 'NOUN',
      },
      {
        word: 'be',
        type: 'VERB',
      },
    ],
  },
  {
    title: 'Car stuff!!',
    keywords: [
      {
        word: 'vehicle',
        type: 'NOUN',
      },
    ],
  },
];

const getMatches = (analysis, targets) => {
  const matches = targets.map((target) => {
    const words = target.keywords;
    const matchingWords = words.map((targetToken) => {
      const { word, type } = targetToken;
      return _.some(analysis.wordsByType[type], foundWord => foundWord === word);
    }).filter(a => a);
    return {
      target: target.title,
      match: (matchingWords.length / words.length).toFixed(2),
    };
  });
  return matches;
};

/* eslint-disable no-console */
const askAndAnalyze = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Next phrase? ', (answer) => {
    console.log(`Analyzing: ${answer}`);
    const start = new Date().getTime();
    NLP.analyzePhrase(answer)
      .then((analysis) => {
        fs.writeFileSync('analysis.json', JSON.stringify(analysis, null, 2));
        console.log('Analysis took', (new Date().getTime() - start) / 1000, 's');
        const matches = getMatches(analysis, testTargets);
        const bestMatch = matches.sort((a, b) => a.match - b.match).pop();
        // console.log(JSON.stringify(getMatches(analysis, testTargets), null, 2));
        if (bestMatch !== undefined && bestMatch.match > 0) {
          console.log(`Match found with ${bestMatch.match} accuracy ${bestMatch.target}`);
        } else {
          console.log('No matching target found');
        }
        askAndAnalyze();
      });
    rl.close();
  });
};
/* eslint-enable no-console */


NLP.init()
  .then(() => askAndAnalyze());
