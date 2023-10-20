import puppeteer from "puppeteer";


export const ScrapMaker = async (
  url,
  cardSelector,
  nombreSelector,
  precioSelector,
  imgSelector
) => {

  //CODIGO PARA METER A DB LOS PRODUCTOS SCRAPEADOS
  // const addToDb = async (products) => {
  //   for (const prod of products) {
  //     const { nombre, precio, img } = prod;
  //     try {
  //       const result = await addProducto(nombre, precio, img);
  //       console.log(result[0].insertId);
  //     } catch (error) {
  //       console.error("Error adding product to database:", error);
  //     }
  //   }
  // };

  const scrap = async () => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForSelector(cardSelector);

      await autoScroll(page);

      const productData = await page.evaluate(
        (cardSelector, nombreSelector, precioSelector, imgSelector) => {
          const productsCards = document.querySelectorAll(cardSelector);
          const data = Array.from(productsCards).map((prod) => {
            const shadowRoot = prod.shadowRoot || prod;
            const nombreEl = shadowRoot.querySelector(nombreSelector);
            const precioEl = shadowRoot.querySelector(precioSelector);
            const imgEl = shadowRoot.querySelector(imgSelector);

            return {
              nombre: nombreEl ? nombreEl.innerText : "N/A",
              precio: precioEl
                ? precioEl.innerText.replace("$", "").replace(",", "")
                : "N/A",
              img: imgEl ? imgEl.src : "N/A",
            };
          });

          return data;
        },
        cardSelector,
        nombreSelector,
        precioSelector,
        imgSelector
      );

      console.log(productData);
      // await addToDb(productData);
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
