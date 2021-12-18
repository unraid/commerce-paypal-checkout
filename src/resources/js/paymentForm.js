const findClosestParent = (startElement, fn) => {
    const parent = startElement.parentElement;
    if (!parent) return undefined;
    return fn(parent) ? parent : findClosestParent(parent, fn);
};

const initPaypalCheckout = () => {
    // console.debug('[💖 initPaypalCheckout 💖]');
    if (typeof paypal_checkout_sdk === "undefined") {
        setTimeout(initPaypalCheckout, 200);
    } else {
        const $wrapper = document.querySelector('.paypal-rest-form');
        const $form = findClosestParent($wrapper, function(element) {
          return element.tagName === 'FORM';
        });
        const paymentUrl = $wrapper.dataset.prepare;
        const completeUrl = $wrapper.dataset.complete;
        let transactionHash;
        let errorShown = false;

        // console.debug('[💖 initPaypalCheckout 💖]', {
        //     $wrapper,
        //     $form,
        //     paymentUrl,
        //     completeUrl,
        //     transactionHash,
        //     errorShown,
        // });

        paypal_checkout_sdk.Buttons({
            createOrder: (data, actions) => {
                const form = new FormData($form);
                // console.debug('[💖 createOrder 💖]', { form });
                return fetch(paymentUrl, {
                    method: 'post',
                    body: form,
                    headers: {
                        'Accept': 'application/json'
                    }
                }).then((res) => {
                    // console.debug('[💖 createOrder.then 💖]', { res });
                    return res.json();
                }).then((data) => {
                    // console.debug('[💖 createOrder.then 💖]', { data });
                    if (data.error) {
                        let errorMessage = '';
                        try { // Handle PayPal errors
                            const error = JSON.parse(data.error);
                            if (error.details && error.details.length) errorMessage = error.details[0].description;
                        } catch (e) { // Handle Commerce errors
                            errorMessage = data.error;
                        }

                        throw Error(errorMessage);
                    }
                    transactionHash = data.transactionHash;
                    return data.transactionId; // Use the same key name for order ID on the client and server
                }).catch((error) => {
                    console.error('[😭 createOrder.catch 😭]', error);
                    errorShown = true;
                    alert(error);
                });
            },
            onError: (err) => {
                console.error('[😭 onError 😭]', { err });
                $form.dataset.processing = false;
                if (!errorShown) {
                    alert(err);
                }
            },
            onApprove: (data, actions) => {
                let separator = '?';
                if (completeUrl.indexOf('?') >= 0) {
                    separator = '&';
                }
                // console.debug('[💖 onApprove 💖]', { data });
                togglePaymentLoader();

                /* tag manager data layer */
                onCheckout('paypal');

                window.location = completeUrl + separator + 'commerceTransactionHash=' + transactionHash;
            }
        }).render('#paypal-button-container');
    }
};

initPaypalCheckout();
