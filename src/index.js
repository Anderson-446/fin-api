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

//Balance
function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        
        if(operation.type ==="credit") {
            return acc + parseInt(operation.amount);
        } else {
            return acc - parseInt(operation.amount);
        }
    },0);

    return balance
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
//Filtro por data
app.get("/statement/date", verifyAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    if(statement.length === 0) {
        return res.status(404).json({ error: "Nenhum registro encontrado para esta data"})
    }
    return res.json(statement)
});

/**
 * DEPOSITAR
 */

app.post("/deposit", verifyAccountCPF, (req, res) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation =  {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    console.log(statementOperation);

    return res.status(201).send({ message: `Depósito de R$${statementOperation.amount} adicionado à sua conta com sucesso, ${customer.name}!` });
});

/**
 * SACAR
 */

app.post("/withdraw", verifyAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    // const balance = customer.statement.reduce((acc, operation) => {
    //     if (operation.type === 'credit') {
    //         return acc + parseInt(operation.amount);
    //     } else {
    //         return acc - parseInt(operation.amount);
    //     }
    // }, 0)
    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return res.status(400).send({ message: "Saldo insuficiente para saque."})
    }

    const statementOperation = {
        description: `Saque de R$${amount}`,
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);
    
    return res.status(200).send({ message: `Saque de R$${amount} realizado com sucesso!`});
});

/**
 * ATUALIZAR CONTA
 */

app.put("/account", verifyAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).send();

})

/**
 * BUSCAR DADOS
 */

app.get("/account", verifyAccountCPF, (req, res) => {
    const { customer } = req;

    res.status(200).json(customer)
})

/**
 * DELETAR CONTA
 */

app.delete("/account", verifyAccountCPF, (req, res) => {
    const { customer } = req;

    //splice

    customers.splice(customer, 1);

    res.status(200).json(customers)

});

/**
 * BALANÇO DA CONTA
 */

app.get("/balance", verifyAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
})

//INICIALIZAÇÃO DO SERVIDOR
app.listen(port, () => {
    console.log("servidor rodando na porta:", port)
});