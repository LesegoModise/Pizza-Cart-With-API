document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCartWithAPIWidget', () => {
        return {
            title: 'Pizza Cart - API',
            pizzas: [],
            filteredPizzas: [],
            username: '',
            cartId: '',
            cartPizzas: [],
            cartTotal: 0.00,
            paymentAmount: 0,
            message: '',
            selectedSpecialty: '',
            historicalOrders: [],
            showHistoricalOrders: false,
            featuredPizzas: [],
            favourites: [],
            maxFavourites: 3,

            specialties: {
                chicken: ['Sweet Chilli Chicken', 'Chicken & Mushroom', 'Tikka Chicken'],
                meaty: ['Regina', 'Four Season'],
                vegetarian: ['3 Cheese', 'Garlic & Mushroom', 'Margherita'],
                specialty: ['Hawaiian'],
            },

            login() {
                if (this.username.length > 2) {
                    localStorage['username'] = this.username;
                    this.createCart();
                } else {
                    alert('Username is too short');
                }
            },

            logout() {
                if (this.cartTotal > 0) {
                    if (confirm('You have items in your cart. Do you want to clear the cart and logout?')) {
                        // this.username = '';
                        this.featuredPizzas = [];
                        // this.cartId = '';
                        // localStorage.clear();
                        this.clearCartAndLogout();
                        this.showHistoricalOrders = !this.showHistoricalOrders
                    }
                } else {
                    this.clearCartAndLogout();
                }
            },

            clearCartAndLogout() {
                this.username = '';
                this.cartId = '';
                localStorage['cartId'] = '';
                localStorage['username'] = '';
                this.cartPizzas = [];
                this.cartTotal = 0.00;
                this.paymentAmount = 0;
                this.showHistoricalOrders = false
            },

            createCart() {
                if (!this.username) {
                    // this.cartId = 'No username to create a cart for';
                    return Promise.resolve();
                }

                let userCartMapping = JSON.parse(localStorage.getItem('userCartMapping') || '{}');
                const existingCartId = userCartMapping[this.username];

                if (existingCartId) {
                    this.cartId = existingCartId;
                    localStorage['cartId'] = this.cartId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            // console.log('New cartId created:', this.cartId);
                            localStorage['cartId'] = this.cartId;
                            userCartMapping[this.username] = this.cartId;
                            localStorage.setItem('userCartMapping', JSON.stringify(userCartMapping));
                        });
                }

                // const cartId = localStorage['cartId'];
                // console.log('Retrieved cartId from localStorage:', cartId);

                // if (cartId) {
                //     this.cartId = cartId;
                //     return Promise.resolve();
                // } else {
                //     const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
                //     return axios.get(createCartURL)
                //                 .then(result => {
                //                     this.cartId = result.data.cart_code; 
                //                     console.log('New cartId created:', this.cartId);
                //                     localStorage['cartId'] = this.cartId;
                //                 });
                // }

            },

            getCart() {
                // console.log(this.cartId, 'getCart function');
                if (!this.cartId) {
                    // console.error('No cartId available for getCart');
                    return Promise.reject('No cartId available');
                }
                const getCarturl = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`
                return axios.get(getCarturl);
            },

            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },

            removePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },

            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cartId,
                    amount
                });

            },

            fetchFeaturedPizzas() {
                const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
                axios.get(featuredPizzasURL).then((result) => {
                    this.featuredPizzas = result.data.pizzas;
                });
            },

            manageFeaturedPizza(pizzaId) {
                const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured`;
                axios.post(featuredPizzasURL, {
                    'username': this.username,
                    'pizza_id': pizzaId
                }).then(() => {
                    this.fetchFeaturedPizzas();
                });
            },


            showCartData() {
                this.getCart()
                    .then(result => {
                        const cartData = result.data;
                        this.cartPizzas = cartData.pizzas.map(pizza => {
                            pizza.total = (pizza.price * pizza.qty).toFixed(2);
                            return pizza;
                        });
                        this.cartTotal = cartData.total.toFixed(2);
                        // console.log('Cart data retrieved:', this.cartId);
                    // alert(this.cartTotal);
                    // this.cartPizzas = result.data.pizzas
                }) 
                // .catch (error => {
                //     console.log(error);
                // }

                // );
            },

            init() {

                const storedUsername = localStorage['username'];
                if (storedUsername) {
                    this.username = storedUsername;
                }


                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas;
                        this.filteredPizzas = this.pizzas;
                    });

                if (!this.cartId) {
                    this
                        .createCart()
                        .then(() => {
                            this.showCartData();
                        });
                }

                this.fetchFeaturedPizzas();
                // console.log(this.fetchFeaturedPizzas());
            },

            addPizzaToCart(pizzaId) {
                // const pizza = this.pizzas.find(pizza => pizza.id === pizzaId);
                // if (pizza) {
                //     const existingPizza = this.cartPizzas.find(p => p.id === pizzaId);
                //     if (existingPizza) {
                //         existingPizza.qty += 1;
                //         existingPizza.total = existingPizza.price * existingPizza.qty;
                //     } else {
                //         this.cartPizzas.push({ ...pizza, qty: 1, total: pizza.price });
                //     }
                //     this.updateCartTotal();
                // }
                // alert(pizzaId)
                this
                    .addPizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    })
            },

            removePizzaFromCart(pizzaId) {
                // const pizzaIndex = this.cartPizzas.findIndex(p => p.id === pizzaId);
                // if (pizzaIndex > -1) {
                //     this.cartPizzas.splice(pizzaIndex, 1);
                //     this.updateCartTotal();
                // }
                // alert(pizzaId)
                this
                    .removePizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    });
            },

            updateCartTotal() {
                this.cartTotal = this.cartPizzas.reduce((total, pizza) => total + pizza.total, 0);
            },

            payForCart() {
                // alert('Pay Now!' + this.paymentAmount)

                if (!this.cartId) {
                    this.message = 'Cart not active. Please log in or create a new cart.';
                    setTimeout(() => this.message = '', 5000);
                    return;
                }

                if (this.paymentAmount <= 0 || this.paymentAmount < this.cartTotal) {
                    this.message = 'Please enter a valid payment amount.';
                    setTimeout(() => this.message = '', 5000);
                    return;
                }

                this
                    .pay(this.paymentAmount)
                    .then(result => {
                        if (result.data.status === 'failure') {
                            this.message = result.data.message;
                            setTimeout(() => this.message = '', 5000);
                        } else {
                            const change = (this.paymentAmount - this.cartTotal).toFixed(2);
                            const receipt = {
                                username: this.username,
                                cartId: this.cartId,
                                pizzas: this.cartPizzas,
                                total: this.cartTotal,
                                paymentAmount: this.paymentAmount,
                                change: change,
                                dateTime: new Date().toLocaleString()
                            };
                            this.saveReceipt(receipt);

                            this.message = result.data.status == 'success' && this.paymentAmount >= this.cartTotal ?
                                `Payment Received. Your Change is R${change}` :
                                'Payment Failed!';

                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                this.paymentAmount = 0;
                                // this.createCart().then(() => {
                                //     // this.showCartData();
                                // });
                                this.cartId = '';                                    
                                localStorage['cartId'] = '';
                                this.createCart(); 
                            }, 5000);
                        }
                        // } else if (result.data.status == "success" && this.paymentAmount > this.cartTotal) {
                        //     const change = (this.paymentAmount - this.cartTotal).toFixed(2);
                        //     this.message = "Payment Received. Your is change R" + change;
                        //     setTimeout(() => {
                        //         this.message = '';
                        //         this.cartPizzas = [];
                        //         this.cartTotal = 0.00;
                        //         this.cartId = '';
                        //         this.paymentAmount = 0;
                        //         localStorage['cartId'] = '';
                        //         this.createCart();
                        //     }, 5000);
                        // }                          

                        // else {
                        //     this.message = 'Payment Received!';
                        //     setTimeout(() => {
                        //         this.message = '';
                        //         this.cartPizzas = [];
                        //         this.cartTotal = 0.00;
                        //         this.cartId = '';
                        //         this.paymentAmount = 0;
                        //         localStorage['cartId'] = '';
                        //         this.createCart();
                        //     }, 5000);
                        // }
                    });
            },

            saveReceipt(receipt) {
                let historicalOrders = JSON.parse(localStorage.getItem('historicalOrders') || '[]');
                historicalOrders.unshift(receipt);
                if (historicalOrders.length > 3) {
                    historicalOrders.pop();
                }
                localStorage.setItem('historicalOrders', JSON.stringify(historicalOrders));
            },

            toggleHistoricalOrders() {
                this.showHistoricalOrders = !this.showHistoricalOrders;
                // alert(this.showHistoricalOrders)
                if (this.showHistoricalOrders) {
                    let allHistoricalOrders = JSON.parse(localStorage.getItem('historicalOrders') || '[]');
                    this.historicalOrders = allHistoricalOrders.filter(order => order.username === this.username);
                } else {
                    this.historicalOrders = [];
                }
            },

            isSpecialtyPizza(pizza) {
                return this.specialties.chicken.includes(pizza.flavour) ||
                    this.specialties.meaty.includes(pizza.flavour) ||
                    this.specialties.vegetarian.includes(pizza.flavour) ||
                    this.specialties.specialty.includes(pizza.flavour);
            },

            filterBySpecialty() {
                if (this.selectedSpecialty === '') {
                    this.filteredPizzas = this.pizzas;
                } else {
                    const specialties = this.specialties[this.selectedSpecialty];
                    this.filteredPizzas = this.pizzas.filter(pizza => specialties.includes(pizza.flavour));
                }
            },

            // toggleFavourite(pizzaId) {
            //     const pizzaIndex = this.favourites.indexOf(pizzaId);
            //     if (pizzaIndex > -1) {
            //         this.favourites.splice(pizzaIndex, 1);
            //     } else {
            //         if (this.favourites.length >= this.maxFavourites) {
            //             this.favourites.shift(); // Remove the oldest favourite
            //         }
            //         this.favourites.push(pizzaId);
            //     }
            // },

            // isFavourite(pizzaId) {
            //     return this.favourites.includes(pizzaId);
            // }

            filterPizzasBySpecialty() {
                if (this.selectedSpecialty === '') {
                    this.filteredPizzas = this.pizzas;
                } else {
                    const specialties = this.specialties[this.selectedSpecialty];
                    this.filteredPizzas = this.pizzas.filter(pizza => specialties.includes(pizza.flavour));
                }
            },
        }
    });
});





