
const express = require('express');
const { get } = require('express/lib/response');
const {v4: uuid} = require('uuid');

const app = express();

const customers = [];


app.use(express.json());


//Middleware
function verifyIfExistAccountCPF(request, response, next){
    const {cpf} = request.headers;
    const customer = customers.find(customer => customer.cpf === cpf);
    
    if(!customer){
        return response.status(400).send({error: "Customer not found"});
    }

    request.customer = customer;
    return next();
}


//Sistema de Banco Simplificado 
app.post("/account", (request, response) =>{
    const {cpf, name} = request.body;

    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf);

    if (customersAlreadyExists) {
        return response.status(400).send({error: "Customer already exists!"});
    } else {
        customers.push({
            cpf,
            name,
            id: uuid(),
            balance: 0.00,
            statement: []
        });
        return response.status(201).send();
    } 

});

app.use(verifyIfExistAccountCPF);

app.get("/account", (request, response) => {
    const {customer} = request;
    return response.status(200).json(customer);
});

app.get("/statement/", (request, response) => {
    const {customer} = request;
    return response.status(200).json(customer.statement)
});

app.post("/deposit",(request, response) => {
    const {description, amount} = request.body;
    const {customer} = request

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.balance += amount;
    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", (request,response) =>{
    const {amount} = request.body;
    const {customer} = request;

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "withdraw"
    };

    if(customer.balance < amount){
        return response.status(400).send({error: "Saldo insuficiente!"});
    }

    customer.balance -= amount;
    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/statement/date", (request, response) => {
    const {customer} = request;
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() === (dateFormat).toDateString()
    );

    return  response.json(statement);
});

app.put("/account", (request, response) => {
    const {name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).send();
});

app.delete("/account", (request,response)=> {
    const {customer} = request;

    customers.splice(customer,1);

    return response.status(200).json(customers);
});

app.get("/balance",(request,response) =>{
    const {customer} = request;
    return response.json(customer.balance);
});


app.listen(3000);