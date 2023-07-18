class Producto {
    constructor(id, nombre, precio, categoria, imagen = false) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria;
        this.imagen = imagen;
    }
}

class BaseDatos {
    constructor() {
        //array de un JSON
        this.productos = [];
    }

    //retorno del array
    async sendRegister() {
        const response = await fetch("/catalogo.json");
        this.productos = await response.json();
        return this.productos;
    }

    registerID(id) {
        return this.productos.find((producto) => producto.id === id);
    }

    registerNAME(palabra) {
        const prodsEncontrado = this.productos.filter((producto) =>
            producto.nombre.toLowerCase().includes(palabra)
        );

        const promesa = new Promise((resolve, reject) => {
            setTimeout(() => {
                if (prodsEncontrado.length > 0) {
                    resolve(prodsEncontrado);
                } else {
                    reject(`No se encontro el producto ${palabra} en dicha busqueda`);
                }
            }, 2000);
        });
        return promesa;
    }

    registerCategory(categoria){
        return this.productos.filter((producto) => producto.categoria == categoria);
    }
}

const bd = new BaseDatos();
//Elementos
const divProductos = document.querySelector("#productos");
const divCarrito = document.querySelector("#carrito");
const spanCantidadProductos = document.querySelector("#cantidadProductos");
const spanCantidadProductos2 = document.querySelector("#cantidadProductos2");
const spanTotalCarrito = document.querySelector("#totalCarrito");
const inputBuscar = document.querySelector("#inputBuscar");
const botonCarrito = document.querySelector("section h1");
const botonComprar = document.querySelector("#botonComprar");
const btnCategoria = document.querySelectorAll(".btn-categoria");
const formBuscar = document.querySelector("#formBuscar");

bd.sendRegister().then((productos) => carryProducts(productos));

btnCategoria.forEach((boton)=> {
    boton.addEventListener('click',(event) => {
        event.preventDefault();
        quitarSeleccion();
        boton.classList.add('seleccionado');
        const prodCategoria = bd.registerCategory(boton.innerText);
        carryProducts(prodCategoria);
    })
})

const botonTodos = document.querySelector("#btn-todos");
botonTodos.addEventListener('click',(event) => {
    event.preventDefault();
    quitarSeleccion();
    botonTodos.classList.add("seleccionado")
    carryProducts(bd.productos);
})

const quitarSeleccion = () => {
    const btnSeleccionado = document.querySelector(".seleccionado");
    if(btnSeleccionado){
        btnSeleccionado.classList.remove('seleccionado');
    }
}
// Esta función regular recibe como parámetro un array de productos y se encarga
// de renderizarlos en el HTML
function carryProducts(productos) {
    divProductos.innerHTML = "";
    // Recorremos todos los productos y lo agregamos al div #productos
    for (const producto of productos) {
        // A cada div lo agregamos un botón de Agregar al carrito, y a ese botón le pasamos
        // el atributo data-id, con el id del producto. Eso después nos va a ser muy útil
        // para saber desde que producto estamos haciendo click
        divProductos.innerHTML += `
        <div class="producto">
            <h2>${producto.nombre}</h2>
            <p class="precio">$${producto.precio}</p>
            <div class="imagen">
                <img src="img/${producto.imagen}" />
            </div>
            <a href="#" class="btn btnAgregar" data-id="${producto.id}">Agregar al carrito</a>
        </div>
        `;
    }
    // Botones agregar al carrito: como no sabemos cuántos productos hay en nuestra base de datos,
    // buscamos TODOS los botones que hayamos renderizado recién, y los recorremos uno por uno
    const botonesAgregar = document.querySelectorAll(".btnAgregar");
    for (const boton of botonesAgregar) {
        // Le agregamos un evento click a cada uno
        boton.addEventListener("click", (event) => {
            event.preventDefault();
            // Obtenemos el ID del producto del atributo data-id
            const id = Number(boton.dataset.id);
            // Con ese ID, consultamos a nuestra base de datos por el producto
            const producto = bd.registerID(id);
            // Agregamos el registro (producto) a nuestro carrito
            carrito.agregar(producto);
        });
    }
}

// Clase carrito, para manipular los productos de nuestro carrito
class Carrito {
    constructor() {
        // Cargamos del storage
        const carritoStorage = JSON.parse(localStorage.getItem("carrito"));
        // Inicializamos variables
        this.carrito = carritoStorage || [];
        this.total = 0;
        this.totalProductos = 0;
        // Apenas se crea el carrito, que llame al método listar para que
        // renderice todos los productos que haya en el storage
        this.listar();
    }

    // Método para agregar el producto al carrito
    agregar(producto) {
        // Si el producto está en el carrito, lo guardo en esta variable
        const productoEnCarrito = this.estaEnCarrito(producto);
        if (productoEnCarrito) {
            // suma cantidad si esta en el carrito
            productoEnCarrito.cantidad++;
        } else {
            // Si no está, lo agrego al carrito
            this.carrito.push({ ...producto, cantidad: 1 });
        }
        // Actualizacion del storage
        localStorage.setItem("carrito", JSON.stringify(this.carrito));
        // Actualizacion en el html
        this.listar();
        // Toastify
        Toastify({
            text: `${producto.nombre} fue agregado al carrito`,
            position: "center",
            className: "info",
            gravity: "bottom",
            style: {
                background: "linear-gradient(to right, blue, red)",
                padding:"20px",
                position:"absolute",
                left :"40%",
                color:"white",
            },
        }).showToast();
    }

    // Verificamos si el producto está en el carrito. Usamos desectruración en el parámetro:
    // recibimos el objeto producto en el parámetro pero solo usamos la propiedad id
    estaEnCarrito({ id }) {
        return this.carrito.find((producto) => producto.id === id);
    }

    // Este método es el encargado de actualizar el HTML de nuestro carrito
    listar() {
        // Reiniciamos las variables
        this.total = 0;
        this.totalProductos = 0;
        divCarrito.innerHTML = "";
        // Recorremos todos los productos del carrito y lo agregamos al div #carrito
        for (const producto of this.carrito) {
            divCarrito.innerHTML += `
            <div class="productoCarrito">
                <p>--------------------------</p>
                <h2>${producto.nombre}</h2>
                <p>$${producto.precio}</p>
                <p>Cantidad: ${producto.cantidad}</p>
                <a href="#" data-id="${producto.id}" class="btn btnQuitar">Quitar del carrito</a>
            </div>
        `;
            // Actualizamos los totales
            this.total += producto.precio * producto.cantidad;
            this.totalProductos += producto.cantidad;
        }
        // Oculto el botón Comprar si no hay productos
        if (this.totalProductos > 0) {
            botonComprar.classList.remove("oculto"); // Muestro el botón
        } else {
            botonComprar.classList.add("oculto"); // Oculto el botón
        }
        // Botones de quitar: como no sabemos cuántos productos hay en el carrito,
        // buscamos TODOS los botones que hayamos renderizado recién, y los recorremos uno por uno
        const botonesQuitar = document.querySelectorAll(".btnQuitar");
        for (const boton of botonesQuitar) {
            // Le agregamos un evento onclick a cada uno
            boton.onclick = (event) => {
                event.preventDefault();
                // Llamamos al método quitar, pasándole el ID del producto que sacamos
                // del atributo data-id del HTML
                this.quitar(Number(boton.dataset.id));
            };
        }
        // Actualizamos variables carrito
        spanCantidadProductos.innerText = this.totalProductos;
        spanCantidadProductos2.innerText = this.totalProductos;
        spanTotalCarrito.innerText = this.total;
    }

    // Método para quitar o restar productos del carrito
    quitar(id) {

        const indice = this.carrito.findIndex((producto) => producto.id === id);
        // Si la cantidad del producto es mayor a 1, le resto
        if (this.carrito[indice].cantidad > 1) {
            this.carrito[indice].cantidad--;
        } else {

            this.carrito.splice(indice, 1);
        }
        // Actualizo el storage
        localStorage.setItem("carrito", JSON.stringify(this.carrito));
        // Actualizo el carrito en el HTML
        this.listar();
    }

    // Método para vaciar el carrito
    vaciar() {
        this.carrito = [];
        localStorage.removeItem("carrito");
        this.listar();
    }
}

//Buscador asincronico
formBuscar.addEventListener("submit",(event) => {
    event.preventDefault();
    const palabra = inputBuscar.value;
    divProductos.innerHTML = "<p>Buscando productos....</p>";
    //pedimos a nuestra base de datos que nos traiga todos los registros
    //que conicidan con la palraba ingresada en input
    const promesa1 = bd.registerNAME(palabra.toLowerCase());
    promesa1.then((resultadoBusque) => {
        carryProducts(resultadoBusque);
    }).catch((error) => {
        bd.sendRegister().then((productos) => carryProducts(productos));;
        Swal.fire({
            title: "Sorry",
            text: error,
            icon: "error",
            confirmButtonText: "Aceptar",
        })
    })
})

// Mensaje de compra realizada con la librería Sweet Alert
botonComprar.addEventListener("click", (event) => {
    event.preventDefault();
    Swal.fire({
        title: "Su pedido está en camino",
        text: "¡Su compra ha sido realizada con éxito!",
        icon: "success",
        confirmButtonText: "Aceptar",
    });
    // Vacíamos el carrito
    carrito.vaciar();
    // Ocultamos el carrito en el HTML
    document.querySelector("section").classList.add("ocultar");
});

// Objeto carrito: lo instanciamos a lo último de nuestro archivo JavaScript
// para asegurarnos que TODO esté declarado e inicializado antes de crear el carrito
const carrito = new Carrito();