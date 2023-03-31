const { JSDOM } = require('jsdom');
const { writeFileSync, appendFileSync } = require('fs');

const MEDICINE = 'yarina';// название препарата
const LIMIT = 1; // количество запрашиваемых страниц

// Функция для получения HTML-страницы
const getPageHTML = (page = 1, medicine) =>
  new Promise((resolve, reject) => {
    fetch(`https://www.acmespb.ru/trade/${medicine}`, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `name=${medicine}&page=${page}&form=&order=price&sreg=78`,
      method: 'POST',
      redirect: 'follow',
    })
      .then((response) => {
        if (response.status === 200 && !response.redirected) {
          return resolve(response.text());
        }
        reject(
          'invalid status ' +
          response.status +
          (response.redirected ? ';\n was redirected' : ';\n not redirected') +
          'url: ' +
          response.url
        );
      });
  });

// Функция для парсинга HTML-страницы
const parseHTML = (html) => new JSDOM(html);

// Функция для определения, является ли текущая страница последней
const isLastPage = (html) => {
  const { document } = parseHTML(html).window;
  // если у последнего спана нет класса page, то это последняя страница
  return !Boolean(document.querySelector('.pagin span.page:last-child'));
};

let pageIndex = 1;
const allJsons = [];

// Функция для запроса следующей страницы
const requestNextPage = () => {
  const promise = getPageHTML(pageIndex++, MEDICINE)
  promise.then((html) => {
    // Получение DOM-документ из HTML-страницы
    const document = new JSDOM(html).window;
    // Извлечение данные с текущей страницы и добавляем их в массив для сохранения
    const parseW = parseWindow(document);
    console.log('parseW', parseW.length);
    allJsons.push(parseW);

    // Если текущая страница не последняя или количество страниц не достигло лимита, то запрашиваем следующую страницу
    if (!isLastPage(html) || pageIndex !== LIMIT) {
      console.log('next', pageIndex);
      requestNextPage();
    } else {
      // иначе сохраняем полученные данные в файл
      console.log('last page', allJsons.length);
      const resultArray = allJsons.flat();
      writeFileSync(MEDICINE + '.json', JSON.stringify(resultArray));
    }
  });

  promise.catch((err) => {
    console.error(`Custom Error ${err}`);
    return true;
  });
};

requestNextPage();
/**
 * 
 * @param {Element} row
 * @returns объект с данными об элементе.
 */
const parseItemDataFromRow = (row) => ({
  name: row.querySelector('.cell.name p')?.textContent,
  coords: getCoords(
    // @ts-ignore
    row.querySelector('.cell.address a')?.getAttribute('href')
  ),
  pharmacy: row.querySelector('.cell.pharm a')?.textContent,
  // @ts-ignore
  price: getPrice(row.querySelector('.cell.pricefull')?.textContent),
  date: row.querySelector('.cell.date')?.textContent,
  adddress: row.querySelector('.cell.address a')?.textContent,
});


/**
 * 
 * @param {Object} param0 
 * @returns {Array} массив объектов с данными об элементах на странице
 */
const parseWindow = ({ window }) => {
  // находим все строки с элементами на странице
  const rows = [...window.document.querySelectorAll('.trow:not(.thead)')];
  const arrayItems = rows.map((row) => {
    parseItemDataFromRow(row)
  });
  return arrayItems;
};

/**
 * 
 * @param {String} link
 * @returns  массив координат в формате [широта, долгота].
 */
const getCoords = (link) => {
  if (link == null) {
    return [];
  }
  const url = new URL(link);
  return url.searchParams.get('text')?.split(',').map(parseFloat);
};

/**
 * Функция преобразования строку с ценой в числовой формат
 * @param {String} strPrice
 * @returns
 */
const getPrice = (strPrice) => {
  return strPrice.endsWith('.00')
    ? parseInt(strPrice.slice(0, strPrice.length - 2))
    : parseFloat(strPrice);
};