import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config'
import express from 'express'
import {readFile, writeFile} from 'fs/promises'
import { randomRoommate } from './database/randomRoommate.js';


const app = express()
const __dirname = import.meta.dirname
const filePath = __dirname + "/database/roommates.json";
const filePath2 = __dirname + "/database/gastos.json";



app.use(express.static(__dirname + '/public'))
app.use(express.json())
app.use(express.urlencoded({ extended:true }))



app.get('/roommates', async(_, res) =>{
    try {
        const readAllRoommates = await readFile( filePath, "utf8")
        return res.json(JSON.parse(readAllRoommates));   
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor'}) 
    }
})

app.post('/roommate', async (req,res) =>{
    try {
        const readAllRoommates = await readFile( filePath, "utf8")
        const readAllRoommatesJSON = JSON.parse(readAllRoommates);
        const random = await randomRoommate()
        const name = random.name.first
        const lastname = random.name.last
        const newUser = 
        {   nombre: `${name} ${lastname}` ,
            id: uuidv4(),
            debe: 0,
            recibe: 0
        }
        readAllRoommatesJSON.push(newUser)
        await writeFile(filePath, JSON.stringify(readAllRoommatesJSON), 'utf8');
        const newReadAllRoommates = await readFile(filePath, 'utf8');
        return res.json(JSON.parse(newReadAllRoommates))  

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor'})   
    }
})



app.get('/gastos', async(_, res) =>{
    try {
        const readAllGastos = await readFile( filePath2, "utf8")
        return res.json(JSON.parse(readAllGastos));  
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor'})  
    }
})

app.post('/gasto', async (req,res) =>{
    try {
        const readAllGastos = await readFile( filePath2, "utf8")
        const readAllGastosJSON = JSON.parse(readAllGastos);
        const {roommate, descripcion, monto} = req.body
        const newGasto = {
            roommate,
            descripcion,
            monto,
            id: uuidv4()
        }
        readAllGastosJSON.push(newGasto)
        await writeFile(filePath2, JSON.stringify(readAllGastosJSON), 'utf8');
        const newReadAllGastos = await readFile(filePath2, 'utf8');

        // actualizar cuentas
        const readAllRoommates = await readFile( filePath, "utf8")
        const readAllRoommatesJSON = JSON.parse(readAllRoommates);
        const montoPorRoommate = newGasto.monto / readAllRoommatesJSON.length ;
        readAllRoommatesJSON.forEach(r => {
            if (r.nombre === roommate) {
                r.recibe += montoPorRoommate;
            } else {
                r.debe -= montoPorRoommate;
            }
        });
        await writeFile(filePath, JSON.stringify(readAllRoommatesJSON), 'utf8')
        //

        return res.json(JSON.parse(newReadAllGastos))  
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor'})   
    }
})

app.put('/gasto/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { roommate, descripcion, monto } = req.body;
        const readAllGastos = await readFile(filePath2, "utf8");
        const readAllGastosJSON = JSON.parse(readAllGastos);
        const index = readAllGastosJSON.findIndex((gasto) => gasto.id === id);
        if (index === -1) {
            return res.status(404).json({ ok: false, msg: 'No se encuentra el gasto' });
        }
        
        const oldMonto = readAllGastosJSON[index].monto;
        const oldRoommate = readAllGastosJSON[index].roommate;
        readAllGastosJSON[index].roommate = roommate;
        readAllGastosJSON[index].descripcion = descripcion;
        readAllGastosJSON[index].monto = monto; 
        const readAllRoommates = await readFile(filePath, "utf8");
        const readAllRoommatesJSON = JSON.parse(readAllRoommates);

        // actualizar cuentas
        const roommatesCount = readAllRoommatesJSON.length;
        const oldMontoPorRoommate = oldMonto / roommatesCount;
        const newMontoPorRoommate = monto / roommatesCount;

        readAllRoommatesJSON.forEach(r => {
            if (r.nombre === oldRoommate) {
                r.recibe -= oldMontoPorRoommate;
            } else {
                r.debe += oldMontoPorRoommate;
            }
        });
        readAllRoommatesJSON.forEach(r => {
            if (r.nombre === roommate) {
                r.recibe += newMontoPorRoommate;
            } else {
                r.debe -= newMontoPorRoommate;
            }
        });
        //
        await writeFile(filePath, JSON.stringify(readAllRoommatesJSON), 'utf8');
        await writeFile(filePath2, JSON.stringify(readAllGastosJSON), 'utf8');
        const newReadAllGastos = await readFile(filePath2, 'utf8');
        return res.json(JSON.parse(newReadAllGastos));

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.delete('/gasto/:id', async (req,res) =>{
    try {
        const readAllGastos = await readFile( filePath2, "utf8")
        const readAllGastosJSON = JSON.parse(readAllGastos);
        const {id} = req.params
        const newGastos = readAllGastosJSON.filter((gastos) => gastos.id !== id);
        await writeFile(filePath2, JSON.stringify(newGastos), 'utf8');
        return res.json({ ok: true })  
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor'})   
    }
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`))