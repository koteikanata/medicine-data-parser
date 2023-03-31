/*
* Этот скрипт создает интерактивную карту с помощью Yandex Maps API и 
* отображает на ней данные о различных аптеках в формате Placemark на основе json.
*/
const INITIAL_LOCATION = { center: [59.939098, 30.315868], zoom: 11 };

/*
* Преобразование массива объектов в массив меток на карте. 
* Каждый объект массива преобразуется в метку на карте, в которой указывается цена, название, адрес и аптека
*/
const prepareObjects = (objects) => {
  return objects.map(
    // @ts-ignore
    (object) =>
      // @ts-ignore
      new ymaps.Placemark(
        object.coords,
        {
          iconContent: `${object.price}₽`,
          hintContent: `${object.name}`,
          balloonContentHeader: `<font size=3><b><p>${object.pharmacy}</p></b></font>`,
          balloonContent: `<font size=2>
                              <p>Лекарство: ${object.name}</p>
                              <p>Цена: ${object.price}₽</p>
                              <p>Адрес: ${object.adddress}</p>
                              </font>`,
          balloonContentFooter: `<font size=1>Информация от: ${object.date}</font>`,
          customData: {
            price: parseFloat(object.price),
          },
        },
        {
          preset: 'islands#blackStretchyIcon',
        }
      )
  );
};

// Загрузка карты и данных с сервера.
// @ts-ignore
const mapReady = ymaps.ready(initMap);
const getData = fetch('./data-parser/data/yarina.json').then((dataJson) => dataJson.json());

/*
Функция инициализации карты и кластеризатора. В этой функции определяется, как будут выглядеть кластеры на карте. 
*/
function initMap() {
  Promise.all([mapReady, getData]).then(([_, items]) => {
    // @ts-ignore
    const myMap = new ymaps.Map('map', INITIAL_LOCATION);
    // @ts-ignore
    const clusterer = new ymaps.Clusterer({
      groupByCoordinates: false,
    });

    // Переопределение метода создания кластера, чтобы устанавливать содержимое меток
    const base = clusterer.createCluster;
    clusterer.createCluster = function () {
      const cluster = base.apply(this, arguments);

      const geoObjects = cluster.getGeoObjects();
      const minPrice = Math.min(...geoObjects.map((obj) => obj.properties.get('customData').price));
      cluster.properties.set('iconContent', `${minPrice}₽`);
      cluster.properties.set('hintContent', `${minPrice}₽`);

      return cluster;
    };

    // Преобразование данных в метки на карте и добавление этих меток на карту.
    const placemarks = prepareObjects(items);
    clusterer.options.set({
      gridSize: 80,
      clusterDisableClickZoom: false,
    });
    clusterer.add(placemarks);
    myMap.geoObjects.add(clusterer);

    // Объект для поиска по данным меток
    // @ts-ignore
    const result = ymaps.geoQuery(myMap.geoObjects);
    result.search('properites.customData.price')
  });
}
