import {By} from 'selenium-webdriver';
import sleep from 'sleep';
import {BasePage} from '@fxc/ui-test-framework';


export class CommonElementsPage extends BasePage {
    /**
     * Class to work with common elements
     * Like submit btn, h tags, cookie bar, main logo, loader, a links with text
     * that are across all the app.
     * @type {string}
     */
    SUBMIT_BTN = '[type=submit]';
    LOGOUT_LNK = '[data-qa=logout]';

    constructor() {
        super();
    }

    async submitForm() {
        await this.clickOnElement(this.SUBMIT_BTN);
    }

    async logOut() {
        await this.clickOnElement(this.LOGOUT_LNK);
        return await this.checkElementPresentOrNot(this.LOGOUT_LNK, false);
    }


    async goToLink(linkName, urlContains) {
        let i = 0;
        while (i < 10) {
            if (urlContains !== undefined) {
                const currentUrl = await driver.getCurrentUrl();
                if (!currentUrl.includes(urlContains)) {
                    await this.clickOnElement(By.xpath(`//a[text()='${linkName}']`));
                    sleep.sleep(1);
                    i++;
                } else {
                    return;
                }
            } else {
                await this.clickOnElement(By.xpath(`//a[text()='${linkName}']`));
                return;
            }
        }
    }
}