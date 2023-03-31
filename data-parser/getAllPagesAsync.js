const { JSDOM } = require('jsdom');
const { writeFileSync, appendFileSync } = require('fs');

const getPageHTML = (page = 1, medicine = 'yarina') =>
    new Promise((resolve, reject) => {
        fetch(`https://www.acmespb.ru/trade/${medicine}`, {
            headers: {
                accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: `name=${medicine}&page=${page}&form=&order=price&sreg=78`,
            method: 'POST',
        }).then((response) => {
            if (response.status === 200 && !response.redirected) {
                return resolve(response.text());
            }

            reject('invalid status ' + response.status);
        });
    });

/**
*
* @param {Element} row
* @returns
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
 * @param {String} link
 * @returns
 */
const getCoords = (link) => {
    if (link == null) {
        return;
    }
    const url = new URL(link);
    return url.searchParams.get('text')?.split(',').map(parseFloat);
};


const parseWindow = (dom) => {
    // console.log(dom);
    const rows = dom.window.document.querySelectorAll('.trow:not(.thead)');
    console.log(rows);
    // const arrayItems = row/s.map((row) => parseItemDataFromRow(row));
    // return arrayItems;
};

(async function () {
    let index = 1;
    const dataJson = await getPageHTML(index)
        .then((html) => {
            const dom = new JSDOM(html).window;
            return dom;
        })
        .then((window) => {
            const rows = [...window.document.querySelectorAll('.trow:not(.thead)')];
            console.log(rows);
            // const result = parseWindow(dom);
            // return result;
        })
    // .then((result) => writeFileSync('yarina.json', JSON.stringify(result)));
})();

// Promise.all([
//   getPageHTML(1),
//   getPageHTML(2),
//   getPageHTML(3),
//   getPageHTML(4),
//   getPageHTML(5),
// ]).then((htmls) => {
//   const doms = htmls.map((html) => new JSDOM(html));
//   const allJsons = doms.map((dom) => parseWindow(dom));
//   const resultArray = allJsons.flat();
//   writeFileSync('parse.json', JSON.stringify(resultArray));
// });


// const getAllPagesWithLimit = () => {
//     let isRemainPages = true;
//     let concurrency = 0;
//     let number = 1;

//     return new Promise((resolve, reject) => {
//         const runPromise = () => {
//             if (concurrency === LIMIT || !isRemainPages) {
//                 return;
//             }

//             concurrency++;

//             new Promise((resolve, reject) => {
//                 getPageHTML(number++)
//                     .then((response) => response.text())
//                     .then((html) => {
//                         console.log(number, html);
//                         const dom = getDocument(html);
//                         const dataJson = parseWindow(dom);
//                         appendFileSync('parse.json', JSON.stringify(dataJson));
//                         isRemainPages = checkRemainPages(dom);
//                         resolve('');
//                     })
//                     .catch((err) => {
//                         reject(err);
//                     })
//                     .finally(() => {
//                         concurrency--;
//                         runPromise();
//                     });
//             });

//             if (!isRemainPages) {
//                 resolve('');
//             }
//         };

//         while (isRemainPages && concurrency < LIMIT) {
//             runPromise();
//         }
//     });
// };
// getAllPagesWithLimit();