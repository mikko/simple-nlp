// POS descriptions http://www.clips.ua.ac.be/pages/mbsp-tags

const _ = require('lodash');
const spacyNLP = require('spacy-nlp');
const WordNet = require('node-wordnet');
const constants = require('./constants');

const nlp = spacyNLP.nlp;
const wordnet = new WordNet();

spacyNLP.server(/*{ port: process.env.IOPORT }*/);

const safeStartupTime = 4000;
let ready = false;

const isRelevantPointer = (type, pointer) => {
  return _.values(constants.pointerTypes).indexOf(pointer.pointerSymbol) !== -1;
};

const getWordnetPointerData = (offset, pos) => wordnet.getAsync(offset, pos);

const flattenRelated = (relatedWords, pointerDistance) => {
  relatedWords.forEach(w => w.pointerDistance = pointerDistance);
  const flatList = _.flatten(relatedWords.map(w => flattenRelated(w.relatedWords, pointerDistance + 1)));
  relatedWords.forEach(w => delete w.relatedWords);
  return [...relatedWords, ...flatList];
};

const convertPOS = wnPos => {
  let foundKey;
  Object.keys(constants.posMap).forEach(key => {
    if (constants.posMap[key] === wnPos) {
      foundKey = key;
    }
  });
  return foundKey;
};

const cleanReport = doc => {
  doc.fullAnalysis = doc.fullAnalysis.map(w => {
    const flatRelated = flattenRelated(w.relatedWords, 0)
    const uniqueRelated = _.uniqWith(flatRelated, (a, b) => a.lemma === b.lemma);
    w.relatedWords = uniqueRelated.sort((a, b) => a.pointerDistance - b.pointerDistance).map(word => {
      const relatedPOS = convertPOS(word.pos);
      if (relatedPOS === undefined) {
        return;
      }
      word.pos = relatedPOS;
      return word;
    }).filter(w => w !== undefined);

    return w;
  });
  return doc;
};

const resolvePointers = (type, word, layer) => {
  const pointers = word.ptrs || [];
  if (layer > constants.maxPointerDepth) {
    word.relatedWords = [];
    return Promise.resolve(_.pick(word, [...constants.wordnetKeys, 'relatedWords']));
  }
  const pointerPromises = pointers
    .filter(ptr => isRelevantPointer(type, ptr)) // Remove pointers we are not curious about
    .map(ptr => getWordnetPointerData(ptr.synsetOffset, ptr.pos));
  return Promise.all(pointerPromises)
    .then(resolvedPointers => Promise.all(resolvedPointers.map(ptr => resolvePointers(type, ptr, layer + 1))))
    .then(resolvedPointers => {
      cleanedPointers = resolvedPointers.map(ptr => _.pick(ptr, [...constants.wordnetKeys, 'relatedWords']));
      //word.relatedWords = word.relatedWords || [];
      word.relatedWords = word.relatedWords === undefined ? cleanedPointers : [...word.relatedWords, ...cleanedPointers];
      //delete cleanedPointers.relatedWords;
      return Promise.resolve(_.pick(word, [...constants.wordnetKeys, 'relatedWords']));
    });
};

const chooseLemma = token => {
  // For some reason lemma sometimes contains something like '-PRON-'
  const validLemma = token.lemma !== undefined && token.lemma[0] !== '-';
  return validLemma ? token.lemma : token.word;
};

const analyzeToken = word => wordnet.lookupAsync(chooseLemma(word));

const analyzePhrase = phrase => {
  return nlp.parse(phrase)
    .then(output => {
      const phraseWords = output[0].parse_list;
      const analysis = {};
      return Promise.all(phraseWords.map(word => {
        return analyzeToken(word)
          .then(wordAnalysis => {
            const pointerPromises = wordAnalysis
              .filter(relatedWord => constants.posMap[word.POS_coarse] === relatedWord.pos)
              .map(relatedWord => resolvePointers(word.POS_coarse, relatedWord, 0))
            return Promise.all(pointerPromises)
          })
          .then(resolvedWords => Promise.resolve({ originalWord: word, relatedWords: resolvedWords }));
      }));
    })
    .then(fullAnalysis => {
      const report = {
        originalMessage: phrase,
        tokenizedMessage: fullAnalysis.map(token => token.originalWord.lemma),
        fullAnalysis
      };
      const cleanedReport = cleanReport(report);
      const wordsByType = fullAnalysis.reduce((res, w) => {
          res[w.originalWord.POS_coarse] = [];
          return res;
        }
        , {});
      const entities = {};
      _.values(constants.entityTypes).forEach(en => entities[en] = []);
      fullAnalysis.forEach(word => {
        word.relatedWords.forEach(relatedWord => {

          const type = relatedWord.pos;
          if (wordsByType[type] === undefined) {
              wordsByType[type] = [];
          }
          wordsByType[type].push(relatedWord.lemma);
        });

        const type = word.originalWord.POS_coarse;
        if (wordsByType[type] === undefined) {
            wordsByType[type] = [];
        }
        wordsByType[type].push(word.originalWord.lemma);

        const entity = word.originalWord.NE;
        const entityCategory = constants.entityTypes[entity];
        if (entityCategory !== undefined) {
          entities[entityCategory].push(word.originalWord.word);
        }
      });

      return Promise.resolve(Object.assign(cleanedReport, { wordsByType, entities }));
    });
};

const init = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      ready = true;
      resolve();
    }, safeStartupTime);
  });
};

module.exports = {
  init,
  analyzePhrase: (phrase) => {
    if (!ready) {
      throw new Error("Not ready");
    }
    return analyzePhrase(phrase);
  }
};
