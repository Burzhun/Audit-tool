import {CommonElementsPage} from "@fxc/ui-test-framework/CommonElementsPage";
import {By} from "selenium-webdriver";
import {sleep} from "sleep";

export class CommonElementsAppPage extends CommonElementsPage {
    h2 = "h2"
    static VISIBLE_MENU_TRANSITION = ".visible.menu"
    OPEN_DROPDOWN_OPTIONS = `${CommonElementsAppPage.VISIBLE_MENU_TRANSITION} > div[role=option]`
    ADD_FIELD_DROPDOWN = "div[data-qa=select-field]"
    GLOBAL_UPDATES_BTN = "button[data-qa='Update Calculated Fields']"
    IS_UPDATING_BTN = "button[data-qa='Updating...']"
    ADD_FIELD_BTN = "button[data-qa=add-field-btn]"
    COMMON_HINT = "div.ui.top.right.popup.transition.visible"
    TABLE_HEADER = "th"
    MENU_TAB = "div.tabular.menu a"
    BODY = "body"
    TITLE = "title"
    REACT_DROPDOWN_LIST = "div[class*=MenuList]";

    constructor() {
        super();
    }

    async addBtn(isAudit = true) {
        const addIt = isAudit ? "" : "-btn";
        return `button[data-qa=add-field${addIt}]`;
    };

    async clickOnGlobalUpdatesButton(self, passed = true) {
        await this.clickOnElement(this.GLOBAL_UPDATES_BTN)
    };

    async global_updates() {
        await this.clickOnElement(this.GLOBAL_UPDATES_BTN);
        await this.handleAlert();
        let i = 0;
        while (i < 100) {
            if (await this.checkElementPresentOrNot(this.GLOBAL_UPDATES_BTN)) {
                return;
            } else {
                sleep.sleep(1);
                i++;
            }
        }
    };

    async addFieldBtnClick() {
        await this.clickOnElement(this.ADD_FIELD_BTN);
    };

    async getHintText() {
        return await this.getElText(this.COMMON_HINT);
    };

    async selectOptionByText(text, reactEl = false) {
        const locator = reactEl ?
            `//div[contains(@class, 'option') and text()='${text}']` :
            `//div[contains(@class, 'visible') and contains(@class, 'menu')]//span[text()='${text}']/parent::div`;
        await this.clickOnElement(By.xpath(locator));
    };

    async openAddFieldDropdown() {
        await this.clickOnElement(this.ADD_FIELD_DROPDOWN);
    };

    async addFieldOnForm(field_name, is_audit = true) {
        await this.openAddFieldDropdown();
        await this.selectOptionByText(field_name);
        await this.clickOnElement(this.addBtn(is_audit));
    };

    async getOptionsList() {
        return await this.getElText(this.OPEN_DROPDOWN_OPTIONS);
    };

    async checkAddFieldBtnVisibility(visible) {
        return await this.checkElementPresentOrNot(this.ADD_FIELD_BTN, visible);
    };

    async getReactDropdownValues() {
        return await this.getElText(this.REACT_DROPDOWN_LIST);
    };

    async get_add_field_dropdown_options() {
        await this.openAddFieldDropdown();
        return await this.getOptionsList();
    };

    async checkElementIsActive(locator, index = 0) {
        const elClass = await this.getElementAttribute(locator, 'class', index);
        return elClass.includes('active');
    };
}