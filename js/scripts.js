// Número de WhatsApp con indicativo y sin signos.
        var WHATSAPP = '573045636955';
        // Opcional: ruta del video de fondo del hero (16:9, sin audio). Ejemplo: 'video/hero.mp4'.
        var HERO_VIDEO = '';

        (function () {
            var root = document.getElementById('sabores');
            var videos = Array.prototype.slice.call(root.querySelectorAll('.stage video'));
            var nameEl = document.getElementById('flavorName');
            var descEl = document.getElementById('flavorDesc');
            var buttons = Array.prototype.slice.call(document.querySelectorAll('.picker button'));
            var COP_PER_USD = 4000;
            var currencyToggle = document.getElementById('currencyToggle');
            var currencyNote = document.getElementById('currencyNote');
            var footerCurrency = document.getElementById('footerCurrency');
            var priceEls = Array.prototype.slice.call(document.querySelectorAll('[data-price-cop]'));
            var isUsd = false;
            var activeVideo = videos[0];
            var activeId = activeVideo.dataset.flavor;
            var requestedId = activeId;
            var busy = 0;
            var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var pendingVideo = null;
            var pendingLoad = null;
            var pendingError = null;
            var ambientLogos = document.getElementById('ambientLogos');
            var ambientIce = document.getElementById('ambientIce');
            var ambientMotes = [];
            var lastScrollY = window.scrollY;
            var downwardScroll = 0;
            var ambientFrame = 0;
            var whatsappFloat = document.getElementById('whatsappFloat');
            var orderDialog = document.getElementById('orderDialog');
            var eventDialog = document.getElementById('eventDialog');
            var eventGallery = document.getElementById('eventGallery');
            var eventSlides = Array.prototype.slice.call(eventGallery.querySelectorAll('.event-slide'));
            var eventCarouselPrev = document.getElementById('eventCarouselPrev');
            var eventCarouselNext = document.getElementById('eventCarouselNext');
            var eventCarouselStatus = document.getElementById('eventCarouselStatus');
            var eventCarouselDots = Array.prototype.slice.call(document.querySelectorAll('.event-carousel-dot'));
            var activeEventSlide = 0;
            var eventCarouselInitialized = false;
            var orderProduct = document.getElementById('orderProduct');
            var orderQuantity = document.getElementById('orderQuantity');
            var mixedFlavorFields = document.getElementById('mixedFlavorFields');
            var mixedFlavorOne = document.getElementById('mixedFlavorOne');
            var mixedFlavorTwo = document.getElementById('mixedFlavorTwo');
            var mixedFlavorError = document.getElementById('mixedFlavorError');
            var orderNotes = document.getElementById('orderNotes');
            var orderItems = document.getElementById('orderItems');
            var orderEmpty = document.getElementById('orderEmpty');
            var orderTotal = document.getElementById('orderTotal');
            var orderTotalValue = document.getElementById('orderTotalValue');
            var sendOrder = document.getElementById('sendOrder');
            var cartItems = [];

            function formatUsd(amountInCop) {
                var wholeDollars = Math.floor(amountInCop / COP_PER_USD);
                var remainder = amountInCop - wholeDollars * COP_PER_USD;
                var fraction = String(remainder * 25).padStart(5, '0').replace(/0+$/, '');
                return '$' + wholeDollars + (fraction ? '.' + fraction : '') + ' USD';
            }

            function formatOrderPrice(amount) {
                return isUsd ?
                    formatUsd(amount) :
                    '$' + (amount / 1000) + ' mil';
            }

            function getLineTotal(item) {
                var addonsTotal = item.addons.reduce(function (sum, addon) {
                    return sum + addon.price;
                }, 0);
                return (item.unitPrice + addonsTotal) * item.quantity;
            }

            function getOrderTotal() {
                return cartItems.reduce(function (total, item) {
                    return total + getLineTotal(item);
                }, 0);
            }

            function formatOrderTotal(amount) {
                return isUsd ? formatUsd(amount) : formatOrderPrice(amount);
            }

            function updateWhatsAppLink() {
                if (!cartItems.length) {
                    sendOrder.href = '#';
                    sendOrder.setAttribute('aria-disabled', 'true');
                    return;
                }
                var lines = ['Hola, quiero hacer este pedido en Montaña Drinks:', ''];
                cartItems.forEach(function (item) {
                    lines.push(item.quantity + ' × ' + item.name + ' — ' + formatOrderTotal(getLineTotal(item)));
                    if (item.addons.length) {
                        lines.push('  Adiciones por unidad: ' + item.addons.map(function (addon) {
                            return addon.name;
                        }).join(', '));
                    }
                });
                var note = orderNotes.value.trim();
                if (note) lines.push('', 'Notas: ' + note);
                lines.push('', 'Total (' + (isUsd ? 'USD' : 'COP') + '): ' + formatOrderTotal(getOrderTotal()));
                sendOrder.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
                sendOrder.setAttribute('aria-disabled', 'false');
            }

            function renderOrderCart() {
                orderItems.replaceChildren();
                cartItems.forEach(function (item, index) {
                    var line = document.createElement('li');
                    var description = document.createElement('div');
                    var name = document.createElement('span');
                    var detail = document.createElement('small');
                    var price = document.createElement('strong');
                    var controls = document.createElement('div');
                    var minus = document.createElement('button');
                    var quantity = document.createElement('span');
                    var plus = document.createElement('button');
                    var remove = document.createElement('button');

                    line.className = 'order-item';
                    description.className = 'order-item-description';
                    name.className = 'order-item-name';
                    name.textContent = item.name;
                    detail.className = 'order-item-detail';
                    detail.textContent = item.quantity + ' × ' + formatOrderPrice(item.unitPrice) + ' por unidad' +
                        (item.addons.length ? ' · ' + item.addons.map(function (addon) {
                            return addon.name;
                        }).join(', ') : '');
                    price.className = 'order-item-total';
                    price.textContent = formatOrderTotal(getLineTotal(item));
                    description.append(name, detail);
                    controls.className = 'order-item-controls';
                    [
                        [minus, 'decrease', '−', 'Restar una unidad'],
                        [plus, 'increase', '+', 'Agregar una unidad'],
                        [remove, 'remove', 'Quitar', 'Quitar producto']
                    ].forEach(function (control) {
                        control[0].type = 'button';
                        control[0].dataset.cartAction = control[1];
                        control[0].dataset.index = index;
                        control[0].textContent = control[2];
                        control[0].setAttribute('aria-label', control[3]);
                        if (control[1] === 'decrease' && item.quantity === 1) control[0].disabled = true;
                        if (control[1] === 'increase' && item.quantity === 20) control[0].disabled = true;
                        if (control[1] === 'remove') control[0].className = 'order-remove';
                        controls.appendChild(control[0]);
                    });
                    quantity.textContent = item.quantity;
                    quantity.setAttribute('aria-live', 'polite');
                    controls.insertBefore(quantity, plus);
                    line.append(description, price, controls);
                    orderItems.appendChild(line);
                });
                orderItems.hidden = cartItems.length === 0;
                orderEmpty.hidden = cartItems.length > 0;
                orderTotal.hidden = cartItems.length === 0;
                orderTotalValue.textContent = formatOrderTotal(getOrderTotal());
                updateWhatsAppLink();
            }

            function syncMixedFlavorFields() {
                var isMixed = orderProduct.value === 'granizado-mixto';
                var isDuplicate = mixedFlavorOne.value === mixedFlavorTwo.value;
                mixedFlavorFields.hidden = !isMixed;
                mixedFlavorError.hidden = !isMixed || !isDuplicate;
                var error = isMixed && isDuplicate ? 'Elige dos sabores diferentes.' : '';
                mixedFlavorOne.setCustomValidity(error);
                mixedFlavorTwo.setCustomValidity(error);
            }

            renderOrderCart();

            function createAmbientMotes() {
                if (reduceMotion) return;
                var compact = window.matchMedia('(max-width: 620px)').matches;
                var moteCount = compact ? 9 : 14;
                for (var i = 0; i < moteCount; i++) {
                    var mote = document.createElement('span');
                    var logo = document.createElement('img');
                    var duration = 20 + Math.random() * 22;
                    var depth = .0007 + Math.random() * .0016;
                    mote.className = 'ambient-mote';
                    mote.style.left = (Math.random() * 94 + 3) + 'vw';
                    mote.style.setProperty('--scroll-shift', '0px');
                    logo.src = 'img/logo.svg';
                    logo.alt = '';
                    logo.draggable = false;
                    logo.style.setProperty('--size', (compact ? 24 + Math.random() * 28 : 30 + Math.random() * 46) + 'px');
                    logo.style.setProperty('--opacity', (.3 + Math.random() * .18).toFixed(2));
                    logo.style.setProperty('--duration', duration + 's');
                    logo.style.setProperty('--delay', (-Math.random() * duration) + 's');
                    logo.style.setProperty('--rotation', (Math.random() * 360) + 'deg');
                    logo.style.setProperty('--drift', ((Math.random() * 16) - 8) + 'vw');
                    mote.appendChild(logo);
                    ambientLogos.appendChild(mote);
                    ambientMotes.push({
                        element: mote,
                        depth: depth,
                        phase: Math.random() * Math.PI * 2,
                        range: 14 + Math.random() * 42
                    });
                }
            }

            function releaseIce() {
                if (ambientIce.childElementCount >= 22) {
                    ambientIce.firstElementChild.remove();
                }
                var visibleMotes = ambientMotes.filter(function (mote) {
                    var bounds = mote.element.firstElementChild.getBoundingClientRect();
                    return bounds.bottom > 0 && bounds.top < window.innerHeight;
                });
                var source = visibleMotes.length ?
                    visibleMotes[Math.floor(Math.random() * visibleMotes.length)] :
                    ambientMotes[Math.floor(Math.random() * ambientMotes.length)];
                var bounds = source.element.firstElementChild.getBoundingClientRect();
                var shard = document.createElement('span');
                var size = 4 + Math.random() * 8;
                shard.className = 'ice-shard';
                shard.style.left = Math.max(8, Math.min(window.innerWidth - 14, bounds.left + bounds.width / 2)) + 'px';
                shard.style.top = Math.max(12, Math.min(window.innerHeight - 36, bounds.bottom - 8)) + 'px';
                shard.style.setProperty('--size', size + 'px');
                shard.style.setProperty('--duration', (1.4 + Math.random() * 1.1) + 's');
                shard.style.setProperty('--drift', ((Math.random() * 100) - 50) + 'px');
                shard.style.setProperty('--rotation', (Math.random() * 540 - 270) + 'deg');
                ambientIce.appendChild(shard);
                shard.addEventListener('animationend', function () {
                    shard.remove();
                }, {
                    once: true
                });
            }

            function updateAmbient() {
                ambientFrame = 0;
                var scrollY = window.scrollY;
                ambientMotes.forEach(function (mote) {
                    var offset = Math.sin(scrollY * mote.depth + mote.phase) * mote.range;
                    mote.element.style.setProperty('--scroll-shift', offset.toFixed(1) + 'px');
                });
                var bursts = Math.min(3, Math.floor(downwardScroll / 130));
                if (bursts) {
                    downwardScroll %= 130;
                    for (var i = 0; i < bursts; i++) releaseIce();
                }
            }

            createAmbientMotes();
            if (!reduceMotion) {
                window.addEventListener('scroll', function () {
                    var currentScrollY = window.scrollY;
                    var delta = currentScrollY - lastScrollY;
                    lastScrollY = currentScrollY;
                    downwardScroll = delta > 0 ? downwardScroll + delta : 0;
                    if (!ambientFrame) ambientFrame = window.requestAnimationFrame(updateAmbient);
                }, {
                    passive: true
                });
            }

            function openOrderDialog() {
                if (!cartItems.length) {
                    var selectedFlavor = buttons.filter(function (button) {
                        return button.getAttribute('aria-pressed') === 'true';
                    })[0];
                    if (selectedFlavor) {
                        var flavorOption = orderProduct.querySelector('option[value="granizado-' + selectedFlavor.dataset.id + '"]');
                        if (flavorOption) orderProduct.value = flavorOption.value;
                    }
                }
                orderDialog.showModal();
            }

            orderProduct.addEventListener('change', syncMixedFlavorFields);
            mixedFlavorOne.addEventListener('change', syncMixedFlavorFields);
            mixedFlavorTwo.addEventListener('change', syncMixedFlavorFields);
            syncMixedFlavorFields();

            whatsappFloat.addEventListener('click', openOrderDialog);

            function updateEventCarousel(index) {
                if (typeof index === 'number') {
                    activeEventSlide = Math.max(0, Math.min(index, eventSlides.length - 1));
                } else {
                    var galleryRect = eventGallery.getBoundingClientRect();
                    var galleryCenter = galleryRect.left + eventGallery.clientLeft + eventGallery.clientWidth / 2;
                    var closestDistance = Infinity;
                    eventSlides.forEach(function (slide, slideIndex) {
                        var slideRect = slide.getBoundingClientRect();
                        var distance = Math.abs(slideRect.left + slideRect.width / 2 - galleryCenter);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            activeEventSlide = slideIndex;
                        }
                    });
                }
                eventCarouselPrev.disabled = activeEventSlide === 0;
                eventCarouselNext.disabled = activeEventSlide === eventSlides.length - 1;
                eventCarouselStatus.textContent = String(activeEventSlide + 1).padStart(2, '0') +
                    ' / ' + String(eventSlides.length).padStart(2, '0');
                eventSlides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle('is-active', slideIndex === activeEventSlide);
                });
                eventCarouselDots.forEach(function (dot, dotIndex) {
                    if (dotIndex === activeEventSlide) dot.setAttribute('aria-current', 'true');
                    else dot.removeAttribute('aria-current');
                });
            }

            function visibleEventSlides() {
                var gap = parseFloat(window.getComputedStyle(eventGallery).gap) || 0;
                return Math.max(1, Math.round(eventGallery.clientWidth / (eventSlides[0].offsetWidth + gap)));
            }

            function goToEventSlide(index, instant) {
                var targetIndex = Math.max(0, Math.min(index, eventSlides.length - 1));
                var galleryRect = eventGallery.getBoundingClientRect();
                var slideRect = eventSlides[targetIndex].getBoundingClientRect();
                var targetLeft = eventGallery.scrollLeft + slideRect.left - galleryRect.left -
                    (eventGallery.clientWidth - slideRect.width) / 2;
                eventGallery.scrollTo({
                    left: Math.max(0, Math.min(targetLeft, eventGallery.scrollWidth - eventGallery.clientWidth)),
                    behavior: instant || reduceMotion ? 'auto' : 'smooth'
                });
                updateEventCarousel(targetIndex);
            }
            eventGallery.addEventListener('scroll', function () {
                updateEventCarousel();
            }, {
                passive: true
            });
            eventCarouselPrev.addEventListener('click', function () {
                goToEventSlide(activeEventSlide - 1);
            });
            eventCarouselNext.addEventListener('click', function () {
                goToEventSlide(activeEventSlide + 1);
            });
            eventCarouselDots.forEach(function (dot) {
                dot.addEventListener('click', function () {
                    goToEventSlide(Number(dot.dataset.eventSlide));
                });
            });
            window.addEventListener('resize', function () {
                goToEventSlide(activeEventSlide, true);
            });

            function openEventDialog() {
                eventDialog.showModal();
                window.requestAnimationFrame(function () {
                    if (!eventCarouselInitialized) {
                        goToEventSlide(Math.floor(visibleEventSlides() / 2), true);
                        eventCarouselInitialized = true;
                    } else {
                        goToEventSlide(activeEventSlide, true);
                    }
                });
            }
            document.getElementById('openEventFromHeader').addEventListener('click', openEventDialog);
            document.getElementById('openEventFromClose').addEventListener('click', openEventDialog);
            document.getElementById('closeEvent').addEventListener('click', function () {
                eventDialog.close();
            });
            eventDialog.addEventListener('click', function (event) {
                if (event.target === eventDialog) eventDialog.close();
            });
            var eventMessage = 'Hola, me interesa contratar las máquinas de granizados de Montaña Drinks para un evento. ¿Podrían brindarme información y disponibilidad?';
            document.getElementById('eventWhatsApp').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(eventMessage);
            document.getElementById('orderBtn').addEventListener('click', function (event) {
                event.preventDefault();
                openOrderDialog();
            });
            document.getElementById('closeOrder').addEventListener('click', function () {
                orderDialog.close();
            });
            orderDialog.addEventListener('click', function (event) {
                if (event.target === orderDialog) orderDialog.close();
            });
            document.getElementById('addOrderItem').addEventListener('click', function () {
                if (!orderQuantity.reportValidity()) return;
                var quantity = Number(orderQuantity.value);
                var selectedOption = orderProduct.selectedOptions[0];
                if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !selectedOption) return;
                if (orderProduct.value === 'granizado-mixto') {
                    syncMixedFlavorFields();
                    if (!mixedFlavorOne.reportValidity()) return;
                }
                var addons = Array.prototype.slice.call(orderDialog.querySelectorAll('input[name="orderAddon"]:checked')).map(function (addon) {
                    return {
                        name: addon.dataset.name,
                        price: Number(addon.dataset.orderPriceCop)
                    };
                });
                cartItems.push({
                    name: orderProduct.value === 'granizado-mixto' ?
                        selectedOption.dataset.name + ' (' + mixedFlavorOne.value + ' + ' + mixedFlavorTwo.value + ')' : selectedOption.dataset.name,
                    unitPrice: Number(selectedOption.dataset.orderPriceCop),
                    quantity: quantity,
                    addons: addons
                });
                orderQuantity.value = '1';
                orderDialog.querySelectorAll('input[name="orderAddon"]').forEach(function (addon) {
                    addon.checked = false;
                });
                renderOrderCart();
            });
            orderItems.addEventListener('click', function (event) {
                var control = event.target.closest('button[data-cart-action]');
                if (!control) return;
                var index = Number(control.dataset.index);
                var item = cartItems[index];
                if (!item) return;
                if (control.dataset.cartAction === 'increase' && item.quantity < 20) item.quantity++;
                if (control.dataset.cartAction === 'decrease' && item.quantity > 1) item.quantity--;
                if (control.dataset.cartAction === 'remove') cartItems.splice(index, 1);
                renderOrderCart();
            });
            orderNotes.addEventListener('input', updateWhatsAppLink);
            sendOrder.addEventListener('click', function (event) {
                if (!cartItems.length) event.preventDefault();
            });

            currencyToggle.addEventListener('click', function () {
                isUsd = !isUsd;
                priceEls.forEach(function (el) {
                    var cop = Number(el.dataset.priceCop);
                    el.textContent = isUsd ? formatUsd(cop) : '$' + (cop / 1000) + ' mil';
                });
                currencyToggle.textContent = isUsd ? 'Precios en COP' : 'Prices to USD';
                currencyToggle.setAttribute('aria-pressed', String(isUsd));
                currencyToggle.setAttribute('aria-label', isUsd ? 'Mostrar precios en pesos colombianos' : 'Mostrar precios en dólares estadounidenses');
                currencyNote.textContent = isUsd ?
                    'Conversión exacta, sin redondeo, usando la tasa referencial de 1 USD = 4.000 COP.' :
                    'Precios en pesos colombianos.';
                footerCurrency.textContent = isUsd ? 'Precios en dólares estadounidenses' : 'Precios en pesos colombianos';
                renderOrderCart();
            });

            if (reduceMotion) activeVideo.pause();

            function select(btn) {
                if (btn.dataset.id === requestedId) return;
                requestedId = btn.dataset.id;
                var token = ++busy;
                if (pendingVideo) {
                    pendingVideo.removeEventListener('loadeddata', pendingLoad);
                    pendingVideo.removeEventListener('error', pendingError);
                    pendingVideo.pause();
                    pendingVideo = null;
                }
                buttons.forEach(function (b) {
                    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
                });
                root.style.setProperty('--accent', btn.dataset.c);
                nameEl.textContent = btn.dataset.name;
                descEl.textContent = btn.dataset.desc;
                if (btn.dataset.id === activeId) return;

                var nextVideo = videos.filter(function (video) {
                    return video !== activeVideo;
                })[0];
                pendingVideo = nextVideo;
                nextVideo.poster = btn.dataset.img;
                nextVideo.dataset.flavor = btn.dataset.id;
                nextVideo.src = btn.dataset.video;

                function showVideo() {
                    nextVideo.removeEventListener('loadeddata', showVideo);
                    nextVideo.removeEventListener('error', handleError);
                    if (pendingVideo === nextVideo) pendingVideo = null;
                    if (token !== busy) return;
                    var playback = reduceMotion ? Promise.resolve() : nextVideo.play();
                    playback.then(function () {
                        if (token !== busy) {
                            if (nextVideo.dataset.flavor !== requestedId) nextVideo.pause();
                            return;
                        }
                        var previousVideo = activeVideo;
                        nextVideo.classList.add('is-active');
                        previousVideo.classList.remove('is-active');
                        previousVideo.pause();
                        activeVideo = nextVideo;
                        activeId = btn.dataset.id;
                    }).catch(function (error) {
                        if (token === busy) console.error('No se pudo reproducir el video del sabor seleccionado.', error);
                    });
                }

                function handleError() {
                    if (token !== busy) return;
                    nextVideo.removeEventListener('loadeddata', showVideo);
                    nextVideo.removeEventListener('error', handleError);
                    if (pendingVideo === nextVideo) pendingVideo = null;
                    console.error('No se pudo cargar el video del sabor seleccionado:', btn.dataset.video);
                }

                pendingLoad = showVideo;
                pendingError = handleError;
                nextVideo.addEventListener('loadeddata', showVideo);
                nextVideo.addEventListener('error', handleError);
                nextVideo.load();
            }
            buttons.forEach(function (b) {
                b.addEventListener('click', function () {
                    select(b);
                });
            });

            if (HERO_VIDEO) {
                var v = document.getElementById('heroVideo');
                v.src = HERO_VIDEO;
                v.hidden = false;
                v.addEventListener('error', function () {
                    v.hidden = true;
                });
            }
        })();
