import puppeteer from "puppeteer";
import { addProducto, getProductos, updateProduct } from "../database.js";

export const ScrapMaker = async (
  categoria,
  distribuidora,
  url,
  cardSelector,
  nombreSelector,
  precioSelector,
  imgSelector
) => {
  const addToDb = async (products) => {
    for (const prod of products) {
      const { nombre, precio_d1, precio_olimpica, precio_exito, img } = prod;
      try {
        const result = await addProducto(
          nombre,
          categoria,
          precio_d1,
          precio_olimpica,
          precio_exito,
          img
        );
        console.log(result[0].insertId);
      } catch (error) {
        console.error("Error adding product to database:", error);
      }
    }
  };

  const updateProducts = async (data, prodsOnDb) => {
    for (const prod of data) {
      const existingProd = prodsOnDb.find(
        (p) =>
          p.nombre.toLowerCase() === prod.nombre.toLowerCase() &&
          p.categoria.toLowerCase() === prod.categoria.toLowerCase()
      );
      if (existingProd) {
        let needsUpdate = false;

        if (prod.precio_d1 !== 0 && prod.precio_d1 !== existingProd.precio_d1) {
          existingProd.precio_d1 = prod.precio_d1;
          needsUpdate = true;
        }
        if (
          prod.precio_exito !== 0 &&
          prod.precio_exito !== existingProd.precio_exito
        ) {
          existingProd.precio_exito = prod.precio_exito;
          needsUpdate = true;
        }
        if (
          prod.precio_olimpica !== 0 &&
          prod.precio_olimpica !== existingProd.precio_olimpica
        ) {
          existingProd.precio_olimpica = prod.precio_olimpica;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const {
            id,
            nombre,
            categoria,
            precio_d1,
            precio_olimpica,
            precio_exito,
            img,
          } = existingProd;
          await updateProduct(
            id,
            nombre,
            categoria,
            precio_d1,
            precio_olimpica,
            precio_exito,
            img
          );
        }
      }
    }
    return data.filter(
      (prod) =>
        !prodsOnDb.some(
          (p) => p.nombre.toLowerCase() === prod.nombre.toLowerCase()
        )
    );
  };

  const scrap = async () => {
    try {
      console.log(`Scraping page: ${url}`);
      const browser = await puppeteer.launch({ headless: false });

      const page = await browser.newPage();

      await page.goto(url);
      // const productsExist = await page.$(cardSelector);

      console.log("Waiting for card selector...");
      await page.waitForSelector(cardSelector, { timeout: 60000 });
      console.log("Card selector found.");

      console.log("Waiting for nombre selector...");
      await page.waitForSelector(nombreSelector, { timeout: 60000 });
      console.log("Nombre selector found.");

      console.log("Waiting for precio selector...");
      await page.waitForSelector(precioSelector, { timeout: 60000 });
      console.log("Precio selector found.");

      console.log("Waiting for img selector...");
      await page.waitForSelector(imgSelector, { timeout: 60000 });
      console.log("Img selector found.");

      await autoScroll(page);

      //       if (distribuidora == "exito") {

      //         await page.click('body');

      // // Esperar a que el modal se cierre

      // // Verificar que el modal se ha cerrado
      // await page.waitForSelector('#wps-overlay-close-button', { visible: true });

      //   // Agregar un pequeño delay
      //    new Promise(r => setTimeout(r, 5000));

      //   // Hacer clic en el botón de cierre del modal
      //   await page.evaluate(() => {
      //     const closeButton = document.querySelector('#wps-overlay-close-button');
      //     closeButton.click();
      //   });

      //   // Esperar a que el modal se cierre
      //   await page.waitForSelector('#wps_popup > div', { hidden: true });

      //   // Verificar que el modal se ha cerrado
      //   const modal = await page.$('#wps_popup > div');
      //   if (modal === null) {
      //     console.log('El modal se ha cerrado correctamente');
      //   } else {
      //     console.log('El modal no se ha cerrado');
      //   }

      //         // Esperar a que el modal se cierre

      //         const input1Value = "sincelejo";
      //         const input2Value = "exito sincelejo";

      //         await page.evaluate(
      //           (input1Value, input2Value) => {
      //             const shadowHost = document.querySelector(
      //               ".exito-geolocation-3-x-modalContainer"
      //             );
      //             if (shadowHost) {
      //               const shadowRoot = shadowHost.shadowRoot;
      //               if (shadowRoot) {

      //                 const inputs = document.querySelectorAll(['.css-1g6gooi > div > input'])

      //                 const input1 = shadowRoot.inputs[0]

      //                 const input2 =  shadowRoot.inputs [1]

      //                 const boton = shadowRoot.querySelector(
      //                   ".exito-geolocation-3-x-primaryButtonEnable"
      //                 );

      //                 if (input1 && input2 && boton) {
      //                   input1.value = input1Value;
      //                   input2.value = input2Value;
      //                   boton.click();
      //                 } else {
      //                   console.error(
      //                     "No se encontraron los elementos dentro del Shadow DOM"
      //                   );
      //                 }
      //               } else {
      //                 console.error("No se encontró el Shadow DOM");
      //               }
      //             } else {
      //               console.error("No se encontró el Shadow Host");
      //             }
      //           },
      //           input1Value,
      //           input2Value
      //         );
      //       }

      const productData = await page.evaluate(
        (
          distribuidora,
          categoria,
          cardSelector,
          nombreSelector,
          precioSelector,
          imgSelector
        ) => {
          const productsCards = document.querySelectorAll(cardSelector);
          return Array.from(productsCards).map((prod) => {
            const shadowRoot = prod.shadowRoot || prod;
            const nombreEl = shadowRoot.querySelector(nombreSelector);
            const precioEl = shadowRoot.querySelector(precioSelector);
            const imgEl = shadowRoot.querySelector(imgSelector);

            const baseProduct = {
              nombre: nombreEl ? nombreEl.innerText : "N/A",
              categoria: categoria,
              precio_d1: 0,
              precio_olimpica: 0,
              precio_exito: 0,
              img: imgEl ? imgEl.src : "N/A",
            };

            if (distribuidora === "olimpica") {
              baseProduct.precio_olimpica = precioEl
                ? precioEl.innerText.replace("$", "")
                : "N/A";
            } else if (distribuidora === "d1") {
              baseProduct.precio_d1 = precioEl
                ? precioEl.innerText.replace("$", "")
                : "N/A";
            } else {
              baseProduct.precio_exito = precioEl
                ? precioEl.innerText.replace("$", "")
                : "N/A";
            }

            return baseProduct;
          });
        },
        distribuidora,
        categoria,
        cardSelector,
        nombreSelector,
        precioSelector,
        imgSelector
      );
      //  const ejemplo = [{
      //         nombre: "Piña unidad",
      //         categoria: "fruta",
      //         precio_d1: "9000",
      //         precio_olimpica: "8000",
      //         precio_exito: " 8.090"
      //       }]
      const prodsOnDb = await getProductos();
      const updatedData = await updateProducts(productData, prodsOnDb);
      await addToDb(updatedData);

      console.log(updatedData);
      await browser.close();
    } catch (error) {
      console.error("Error during scraping:", error);
    }
  };

  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  await scrap();
};

for (let i = 1; i <= 6; i++) {
  await ScrapMaker(
    "frutas",
    "exito",
    `https://tienda.exito.com/mercado/frutas-y-verduras?page=${i}`,
    ".vtex-search-result-3-x-galleryItem",
    ".vtex-store-components-3-x-productBrand",
    ".exito-vtex-components-4-x-PricePDP > span",
    ".vtex-product-summary-2-x-image"
  );
}

// for (let i = 1; i <= 9; i++) {
//   await ScrapMaker(
//     "exito",
//     `https://tienda.exito.com/mercado/pollo-carne-y-pescado?_ga=2.260112526.208548039.1697821974-1837544937.1697821974&_gac=1.262858366.1697838886.CjwKCAjwysipBhBXEiwApJOcu26rzZ_N5f_1p_1M5Yuvf_WaPu-IcGaCKIrkMg8oZiPnaiEQ57Kq7BoC9SIQAvD_BwE&page=${i}`,
//     ".vtex-search-result-3-x-galleryItem",
//     ".vtex-store-components-3-x-productBrand",
//     ".exito-vtex-components-4-x-PricePDP > span",
//     ".vtex-product-summary-2-x-image"
//   );
// }

// for (let i = 1; i <= 30; i++) {
//   await ScrapMaker(
//     "exito",
//     `https://tienda.exito.com/mercado/lacteos-huevos-y-refrigerados?page=${i}`,
//     ".vtex-search-result-3-x-galleryItem",
//     ".vtex-store-components-3-x-productBrand",
//     ".exito-vtex-components-4-x-PricePDP > span",
//     ".vtex-product-summary-2-x-image"
//   );
// }

// for (let i = 1; i <= 42; i++) {
//   await ScrapMaker(
//     "exito",
//     `https://tienda.exito.com/mercado/snacks?page=${i}`,
//     ".vtex-search-result-3-x-galleryItem",
//     ".vtex-store-components-3-x-productBrand",
//     ".exito-vtex-components-4-x-PricePDP > span",
//     ".vtex-product-summary-2-x-image"
//   );
// }

// for (let i = 1; i <= 18; i++) {
//   await ScrapMaker(
//     "exito",
//     `https://tienda.exito.com/mercado/vinos-y-licores?page=${18}`,
//     ".vtex-search-result-3-x-galleryItem",
//     ".vtex-store-components-3-x-productBrand",
//     ".exito-vtex-components-4-x-PricePDP > span",
//     ".vtex-product-summary-2-x-image"
//   );
// }

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/bebidas/BEBIDAS",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/lacteos/L%C3%81CTEOS",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );
// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/aseo-y-cuidado-personal/ASEO%20Y%20CUIDADO%20PERSONAL",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );
// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/aseo-hogar/ASEO%20HOGAR",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );
// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/alimentos-y-despensa/ALIMENTOS%20Y%20DESPENSA",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );
// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/congelados/CONGELADOS",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/bebe/BEB%C3%89",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/mascotas/MASCOTAS",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/otros/OTROS",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "d1",
//   "https://domicilios.tiendasd1.com/ca/alimentos-y-despensa/verduras-y-frutas/ALIMENTOS%20Y%20DESPENSA/FRUTAS%20Y%20VERDURAS-.",
//   ".card-product-vertical.product-card-default",
//   ".bWeSzf",
//   ".bhSKFL",
//   ".prod__figure__img"
// );

// await ScrapMaker(
//   "olimpica",
//   `https://www.olimpica.com/supermercado/desayuno?page=${i}`,
//   ".vtex-product-summary-2-x-container",
//   ".vtex-product-summary-2-x-productBrand",
//   ".vtex-product-price-1-x-sellingPrice--hasListPrice--dynamicF",
//   ".vtex-product-summary-2-x-imageNormal"
// );
