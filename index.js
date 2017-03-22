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

const resolvePointers = (type, token) => {
  const pointers = token.ptrs || [];
  //console.log("Pointers", pointers.length);
  const pointerPromises = pointers
    .filter(ptr => isRelevantPointer(type, ptr)) // Remove pointers we are not curious about
    .map(ptr => wordnet.getAsync(ptr.synsetOffset, ptr.pos).then(p => Promise.resolve(p /*_.pick(p, constants.wordnetKeys)*/)));
  //console.log("Pointer promises", pointerPromises.length);
  return Promise.all(pointerPromises)
    .then(resolvedPointers => {
      return Promise.resolve(Object.assign(_.pick(token, constants.wordnetKeys), { pointers: resolvedPointers }))
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
      const tokens = output[0].parse_list;
      console.log(JSON.stringify(tokens, null, 2));
      const analysis = {};
      return Promise.all(tokens.map(token => {
        return analyzeToken(token)
          .then(tokenAnalysis => Promise.all(tokenAnalysis.map(t => resolvePointers(token.POS_coarse, t))))
          .then(resolvedPointers => Promise.resolve(Object.assign(token, { pointers: resolvedPointers })));
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
    analyzePhrase(answer)
      .then(() => {
        
        askAndAnalyze()
      });
    rl.close();
  });
}


setTimeout(() => {
  askAndAnalyze();
  /*
  nlp.parse(testMessage)
    .then(output => {
      const tokens = output[0].parse_list;
      console.log(JSON.stringify(tokens, null, 2));
      const analysis = {};
      return Promise.all(tokens.map(token => {
        return analyzeToken(token)
          .then(tokenAnalysis => Promise.all(tokenAnalysis.map(t => resolvePointers(token.POS_coarse, t))))
          .then(resolvedPointers => Promise.resolve(Object.assign(token, { pointers: resolvedPointers })));
      }));
    })
    .then(analysis => {
      const report = {
        originalMessage: testMessage,
        analysis
      };
      require('fs').writeFileSync('analysis.json', JSON.stringify(report, null, 2));
      process.exit();
    });
*/
  
}, safeStartupTime);

const test = () => {
  rl.question('Test? ', (answer) => {
      // TODO: Log the answer in a database
      console.log(`Analyzing: ${answer}`);
      test();    
    });
}

// test();