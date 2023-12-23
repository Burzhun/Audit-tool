import { configure } from 'enzyme';
import 'regenerator-runtime/runtime';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
//import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

// global.shallow = shallow
// global.render = render
// global.mount = mount
// //global.toJson = toJson
//
// // Fail tests on any warning
// console.error = message => {
//     throw new Error(message)
// }
