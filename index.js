const _ = require('lodash');
const spacyNLP = require('spacy-nlp');
const WordNet = require('node-wordnet');
const constants = require('./constants');
const readline = require('readline');

const nlp = spacyNLP.nlp;
const wordnet = new WordNet();

const testMessage = process.argv[2];

console.log(testMessage);
        
spacyNLP.server(/*{ port: process.env.IOPORT }*/);

const safeStartupTime = 4000; // 15s

console.log('Please wait');

const isRelevantPointer = (type, pointer) => {
  const isSameType = constants.posMap[type] === pointer.pos;
  const isRelevantSymbol = _.values(constants.pointerTypes).indexOf(pointer.pointerSymbol) !== -1;
  return isSameType && isRelevantSymbol;
};

const resolvePointers = (type, word) => {
  const pointers = word.ptrs || [];
  const pointerPromises = pointers
    .filter(ptr => isRelevantPointer(type, ptr)) // Remove pointers we are not curious about
    .map(ptr => wordnet.getAsync(ptr.synsetOffset, ptr.pos).then(p => Promise.resolve(_.pick(p, constants.wordnetKeys))));
  return Promise.all(pointerPromises)
    .then(resolvedPointers => {
      return Promise.resolve(Object.assign(_.pick(word, constants.wordnetKeys), { pointers: resolvedPointers }))
    });
};

const chooseLemma = token => {
  // For some reason lemma sometimes contains something like '-PRON-'
  const validLemma = token.lemma !== undefined && token.lemma[0] !== '-';
  return validLemma ? token.lemma : token.word;
}

const analyzeToken = word => wordnet.lookupAsync(chooseLemma(word));

const analyzePhrase = phrase => {
  console.log("analyzePhrase");
  return nlp.parse(phrase)
    .then(output => {
      const phraseWords = output[0].parse_list;
      console.log(JSON.stringify(phraseWords, null, 2));
      const analysis = {};
      return Promise.all(phraseWords.map(word => {
        return analyzeToken(word)
          .then(wordAnalysis => {
            const pointerPromises = wordAnalysis
              .filter(relatedWord => constants.posMap[word.POS_coarse] === relatedWord.pos)
              .map(relatedWord => resolvePointers(word.POS_coarse, relatedWord));
            return Promise.all(pointerPromises)
          })
          .then(resolvedWords => Promise.resolve({ originalWord: word, relatedWords: resolvedWords }));
      }));
    })
    .then(analysis => {
      const report = {
        originalMessage: phrase,
        analysis
      };
      require('fs').writeFileSync('analysis.json', JSON.stringify(report, null, 2));
      return Promise.resolve();
    });
};

const askAndAnalyze = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Next phrase? ', (answer) => {
    // TODO: Log the answer in a database
    console.log(`Analyzing: ${answer}`);
    const start = new Date().getTime();
    analyzePhrase(answer)
      .then(() => {
        console.log('Analysis took', (new Date().getTime() - start) / 1000, 's');
        askAndAnalyze()
      });
    rl.close();
  });
}


setTimeout(() => {
  askAndAnalyze();
}, safeStartupTime);

const test = () => {
  rl.question('Test? ', (answer) => {
      // TODO: Log the answer in a database
      console.log(`Analyzing: ${answer}`);
      test();    
    });
}

// test();