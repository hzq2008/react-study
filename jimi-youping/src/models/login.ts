import { stringify } from 'querystring';
import type { Reducer, Effect } from 'umi';
import { history } from 'umi';

import { fakeAccountLogin } from '@/services/login';
import { setAuthority } from '@/utils/authority';
import { setToken, delToken } from '@/utils/localStorage';
import { getPageQuery } from '@/utils/utils';
import { message } from 'antd';

export type StateType = {
  status?: 'ok' | 'error';
  type?: string;
  currentAuthority?: 'user' | 'guest' | 'admin';
};

export type LoginModelType = {
  namespace: string;
  state: StateType;
  effects: {
    login: Effect;
    logout: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<StateType>;
  };
};

const Model: LoginModelType = {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(fakeAccountLogin, payload);

      yield put({
        type: 'changeLoginStatus',
        payload: response,
      });

      const { token, user } = response;
      if (!token) return;

      setToken(token);
      setAuthority(user.menu_list);
      const urlParams = new URL(window.location.href);
      const params = getPageQuery();
      message.success('๐ ๐ ๐  ็ปๅฝๆๅ๏ผ');

      let { redirect } = params as { redirect: string };
      if (redirect) {
        const redirectUrlParams = new URL(redirect);
        if (redirectUrlParams.origin === urlParams.origin) {
          redirect = redirect.substr(urlParams.origin.length);

          if (process.env.NODE_ENV !== 'development') {
            redirect = redirect.substr(17);
          }
          if (redirect.match(/^\/.*#/)) {
            // ไป้ๅฏนๅฝๅ้กน็ฎ็ๅค็
            redirect = redirect.substr(redirect.indexOf('#') + 1);
          }
        } else {
          window.location.href = '/';
          return;
        }
      }

      // window.location.replace(`http://plus-test.2856mall.com/operating_panel/${redirect}` || '/');
      // ็ฑไบ้ๅฎๅๅๅฐๅไผๅคๅบไธไธช/user/ ๆๆถๆ?ๆณๅพ็ฅๅๅ?
      history.replace('/');
    },

    logout() {
      delToken();
      localStorage.removeItem('antd-pro-authority');
      const { redirect } = getPageQuery();

      // Note: There may be security issues, please note
      if (window.location.pathname !== '/user/login' && !redirect) {
        history.replace({
          pathname: '/user/login',
          search: stringify({
            redirect: window.location.href,
          }),
        });
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.token ? 'ok' : 'error',
        type: 'account',
      };
    },
  },
};

export default Model;
