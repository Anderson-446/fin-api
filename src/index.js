const express = require('express');
const  {v4: uuid} = require('uuid');

const port = 3333
const app = express();

app.use(express.json());

//Array para persistência
const customers = [];

//Middleware
function verifyAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf)

    if (!customer) {
        return res.status(404).json({ error: "Conta não encontrada." })
    }

    req.customer = customer; // passando o customer para o request

    return next();

}

// CRIAR CONTA
app.post("/account", (req, res) => {
    const {cpf, name} = req.body;

    const cpfExists = customers.some((customer) => customer.cpf === cpf)

    if(cpfExists) {
        return res.status(400).json({error: "CPF já cadastrado no sistema"})
    }
    customers.push({
        id : uuid(),
        cpf,
        name,
        statement: []
    });

    return res.status(201).send();
});

/**
 * BUSCAR EXTRATO
 */

app.get("/statement", verifyAccountCPF, (req, res) => {
    const { customer } = req;
    return res.json(customer.statement);
});

app.listen(port, () => {
    console.log("servidor rodando na porta:", port)
});