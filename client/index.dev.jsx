/*global user, authToken */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import { navigate, login } from './actions';
import 'bootstrap/dist/js/bootstrap';
import ReduxToastr from 'react-redux-toastr';

const store = configureStore();

store.dispatch(navigate(window.location.pathname, window.location.search));

window.onpopstate = function(e) {
    store.dispatch(navigate(e.target.location.pathname));
};

if(typeof user !== 'undefined') {
    store.dispatch(login(user, authToken, user.admin));
}

const container = document.getElementById('component');
const root = createRoot(container);

const render = () => {
    const Application = require('./Application.jsx').default;
    root.render(
        <Provider store={ store }>
            <div className='body'>
                <ReduxToastr
                    timeOut={ 4000 }
                    newestOnTop
                    preventDuplicates
                    position='top-right'
                    transitionIn='fadeIn'
                    transitionOut='fadeOut' />
                <Application />
            </div>
        </Provider>
    );
};

if(module.hot) {
    module.hot.accept('./Application.jsx', () => {
        setTimeout(render);
    });
}

render();
