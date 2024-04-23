const express = require('express');

const port = 3333
const app = express();

app.use(express.json());
/**

 */

/**

 */


app.listen(port, () => {
    console.log("servidor rodando na porta:", port)
});