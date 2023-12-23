import {check_inf, date, email, enumerate, numeric, positive, url} from '../../../server/middleware/validators';
import faker from 'faker';

describe('Check validators functions', () => {
    [{value: '123', valid: true}, {value: '23eere', valid: false}, {value: 'ee23', valid: false}, {
        value: '',
        valid: true
    }, {value: 'Infinity', valid: true}, {value: '-Infinity', valid: true}, {
        value: 'text',
        valid: false
    }, {value: 'NaN', valid: false}].forEach(item => {
        it(`Check item ${item.value} for being numeric`, () => {
            expect(numeric(item.value)).toBe(item.valid);
        });
    });


    [{value: '2021-01-02T23:23:23', valid: true}, {
        value: '2021-01-02 23:23:23',
        valid: true
    }, {value: '2021:01:02T23:23:23', valid: false},
        {value: '2021/01/02T23:23:23', valid: false},
        {
            value: '2021-01-02T45:23:23',
            valid: false
        }, {value: '2021-01-02 45:23:23', valid: false}, {
        value: 'text',
        valid: false
    }].forEach(item => {
        it(`Check item for being date ${item.value}`, () => {
            expect(date(item.value)).toBe(item.valid);
        });
    });


    [{value: 'sdsds', valid: false}, {value: '1@dd', valid: false}, {value: '_@sds', valid: false}, {
        value: '1 @fh.ru',
        valid: false
    }, {value: 'sd@ dd.ru', valid: false}, {value: 'we@er,fh', valid: false}, {
        value: faker.internet.email(),
        valid: true
    }].forEach(item => {
        it(`Check email with pattern ${item.value}`, () => {
            expect(email(item.value)).toBe(item.valid);
        });
    });


    [{value: 'sdsds', valid: false}, {value: 'http  ://dfd.ru', valid: false}, {
        value: 'http://sdfs,wew',
        valid: false
    }, {
        value: 'гугл.ком',
        valid: false
    }, {
        value: 'http://google.com',
        valid: true
    }, {value: 'https://google.com', valid: true}, {value: 'http://www.google.com/ru', valid: true}].forEach(item => {
        it(`Check url value for ${item.value}`, () => {
            expect(url(item.value)).toBe(item.valid);
        });
    });


    [{value: faker.name.firstName(), valid: false, itemArr: [faker.address.country(), faker.address.city()]},
        {value: 'test', valid: false, itemArr: ['test_1', 'test_2']}, {
        value: 'test',
        valid: true,
        itemArr: ['test', 'test_2']
    }].forEach(item => {
        it(`Check enumerate for ${item.value}`, () => {
            expect(enumerate(item.value, item.itemArr)).toBe(item.valid);
        });
    });
    [{value: 'inf', newValue: Infinity}, {value: '-inf', newValue: -Infinity}, {
        value: 'text',
        newValue: 'text'
    }, {value: '123', newValue: '123'}, {value: '123as', newValue: '123as'}].forEach(item => {
        it(`Check is infinity for ${item.value}`, () => {
            expect(check_inf(item.value)).toEqual(item.newValue);
        });
    });


    [{value: '123', constraint: true, isPositive: true}, {value: '123', constraint: false, isPositive: false},
        {value: '-123', constraint: true, isPositive: false}, {value: '-123', constraint: false, isPositive: true}, {
        value: '',
        constraint: true,
        isPositive: true
    }, {value: 'inf', constraint: false, isPositive: false}, {value: '-inf', constraint: false, isPositive: true},
        {value: 'inf', constraint: true, isPositive: true}, {value: '-inf', constraint: true, isPositive: false},{
        value: '0',
        constraint: false,
        isPositive: false
    }, {value: '0', constraint: true, isPositive: true}].forEach(item => {
        it(`Check positive for ${item.value} and constraint=${item.constraint}`, () => {
            expect(positive(item.value, item.constraint)).toBe(item.isPositive)
        });
    });
});