import os
import time

from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.wait import WebDriverWait

from pages.base.expected_conditions import alert_is_not_present


def locator_transform(locator):
    return locator if type(locator) == tuple else (By.CSS_SELECTOR, locator)


class BasePage:
    def __init__(self, browser):
        self.browser = browser
        self.base_url = os.getenv("HOST")

    def __return_element__(self, locator, timeout=10):

        try:
            el = WebDriverWait(self.browser, timeout).until(ec.presence_of_element_located(locator_transform(locator)),
                                                            message=f"Can't find elements by locator {locator_transform(locator)}")
            # self.browser.execute_script("arguments[0].scrollIntoView();", el)
            # self.browser.execute_script("document.querySelector('body').scrollTop-=100;")
            return el
        except TimeoutException:
            return False
        except StaleElementReferenceException:
            return WebDriverWait(self.browser, timeout).until(ec.staleness_of(locator_transform(locator)),
                                                              message=f"Can't find element by locator {locator_transform(locator)}")

    def __return_elements__(self, locator, timeout=10):
        try:
            el = WebDriverWait(self.browser, timeout).until(
                ec.visibility_of_all_elements_located(locator_transform(locator)),
                message=f"Can't find elements by locator {locator}")
            # self.browser.execute_script("arguments[0].scrollIntoView();", el[0])
            # self.browser.execute_script("document.querySelector('body').scrollTop-=100;")
            return el
        except TimeoutException:
            return False

    def __return_clickable_element__(self, locator, timeout=10, index=None):
        try:
            if index is not None:
                try:
                    els = WebDriverWait(self.browser, timeout).until(
                        ec.presence_of_all_elements_located(locator_transform(locator)),
                        message=f"Can't find elements by locator {locator_transform(locator)}")
                    el = els[index]
                except IndexError:
                    return False
            else:
                el = WebDriverWait(self.browser, timeout).until(ec.element_to_be_clickable(locator_transform(locator)),
                                                                message=f"Can't find elements by locator {locator_transform(locator)}")
            return el
        except TimeoutException:
            return False

    def is_element_selected(self, locator, is_selected, timeout=20):
        try:
            return WebDriverWait(self.browser, timeout).until(
                ec.element_selection_state_to_be(self.__return_element__(locator), is_selected),
                message=f"Can't find element by locator {locator_transform(locator)}")
        except TimeoutException:
            return False
        except StaleElementReferenceException:
            return WebDriverWait(self.browser, timeout).until(ec.staleness_of(self.__return_element__(locator)),
                                                              message=f"Can't find element by locator {locator_transform(locator)}")

    def checkbox_is_set(self, locator, index=None, timeout=10):
        if index is not None:
            try:
                els = self.__return_elements__(locator)
                el = els[index]
            except IndexError:
                return False
        else:
            el = self.__return_element__(locator)
        if el:
            try:
                return WebDriverWait(self.browser, timeout).until(ec.element_to_be_selected(el),
                                                                  message=f"Checkbox is not selected {locator_transform(locator)}")
            except TimeoutException:
                return False
        else:
            return False

    def click_on_element(self, locator, index=None, timeout=10, double_click=False):
        el = self.__return_clickable_element__(locator, timeout, index)
        if double_click:
            actionChains = ActionChains(self.browser)
            actionChains.move_to_element(el).double_click(el).perform()
        else:
            el.click()

    def type_in_element(self, locator, text, index=None, timeout=10, clear=True):
        if index is not None:
            el = self.__return_elements__(locator)[index]
        else:
            el = self.__return_element__(locator, timeout)
        if clear:
            # huck for clear fields
            el.clear()
            self.clear_field(el)
        if text:
            el.send_keys(str(text))

    def go_to_url(self, url=None, use_base=True, admin=False):
        if admin:
            base_url = os.getenv("HOST_ADMIN")
        else:
            base_url = os.getenv("HOST")
        if url is None and use_base:
            go_to = base_url
        elif url is None and not use_base:
            go_to = ''
        elif url is not None and use_base:
            go_to = base_url + url
        else:
            go_to = url
        self.browser.get(go_to)

    def check_url_contains(self, url, timeout=10):
        return WebDriverWait(self.browser, timeout).until(ec.url_contains(str(url)),
                                                          message=f"expected url contains {str(url)}")

    def text_present_in_element(self, locator, text, present=True, timeout=10):
        try:
            if present:
                return WebDriverWait(self.browser, timeout).until(
                    ec.text_to_be_present_in_element(locator_transform(locator), str(text)),
                    message=f"expected {locator_transform(locator)} contains {text}")
            else:
                return WebDriverWait(self.browser, timeout).until_not(
                    ec.text_to_be_present_in_element(locator_transform(locator), str(text)),
                    message=f"expected {locator_transform(locator)} does not contain {text}")
        except TimeoutException:
            return False

    def switch_to_tab(self, was, tab_number):
        WebDriverWait(self.browser, 10).until(ec.number_of_windows_to_be(was + 1),
                                              message=f"window is closed")
        self.browser.switch_to.window(self.browser.window_handles[tab_number])

    def confirm_alert(self, wait_for_alert_not_to_be_displayed=True):
        """
        :param wait_for_alert_not_to_be_displayed: set up False if 2 alerts in a row are displayed
        """
        WebDriverWait(self.browser, 10).until(ec.alert_is_present(),
                                              message=f"window is closed")
        self.browser.switch_to.alert.accept()
        if wait_for_alert_not_to_be_displayed:
            WebDriverWait(self.browser, 10).until(alert_is_not_present(),
                                                  message=f"alert is present")
        time.sleep(1)

    def dismiss_alert(self):
        WebDriverWait(self.browser, 10).until(ec.alert_is_present(),
                                              message=f"window is closed")
        self.browser.switch_to.alert.dismiss()

    def get_alert_text(self):
        WebDriverWait(self.browser, 10).until(ec.alert_is_present(),
                                              message=f"alert was not displayed")
        return self.browser.switch_to.alert.text

    def check_element_is_displayed(self, locator, timeout=10):
        try:
            if WebDriverWait(self.browser, timeout).until(ec.visibility_of_element_located(locator_transform(locator)),
                                                          message=f"element with locator {locator_transform(locator)} is on the form"):
                return True
        except TimeoutException:
            return False

    def check_element_is_non_visible(self, locator, timeout=10):
        try:
            if WebDriverWait(self.browser, timeout).until(
                    ec.invisibility_of_element_located(locator_transform(locator)),
                    message=f"element with locator {locator_transform(locator)} is visible"):
                return True
        except TimeoutException:
            return False

    def check_element_is_active(self, locator, timeout=10):
        try:
            el = WebDriverWait(self.browser, timeout).until(
                ec.visibility_of_element_located(locator_transform(locator)),
                message=f"element with locator {locator_transform(locator)} is on the form").get_attribute(
                "class")
            if 'active' not in el:
                return False
            else:
                return True
        except TimeoutException:
            return False

    def get_el_text(self, locator, is_input=False, index=None):
        if index is not None:
            el = self.__return_elements__(locator)[index]
        else:
            el = self.__return_element__(locator)
        if el:
            return el.get_attribute(
                "value") if is_input else el.text
        else:
            return False

    def check_btn_is_enabled(self, locator, index=None):
        return self.__return_elements__(locator)[index].is_enabled() if index is not None else self.__return_element__(
            locator).is_enabled()

    def count_elements(self, locator):
        els = self.__return_elements__(locator)
        return len(els) if els else 0

    def scroll_to_element(self, locator, index=None):
        if index is not None:
            el = self.__return_elements__(locator)[index]
        else:
            el = self.__return_element__(locator_transform(locator))
        actions = ActionChains(self.browser)
        actions.move_to_element(el).perform()
        return el

    def on_hover_element(self, element, via_js=True):
        if via_js:
            js = "var evObj = document.createEvent('MouseEvents');\n" \
                 "evObj.initMouseEvent(\"mouseenter\",true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);\n" \
                 "arguments[0].dispatchEvent(evObj);"
            self.browser.execute_script(js, element)
        else:
            ActionChains(self.browser).move_to_element(element).perform()

    def get_element_size(self, locator, index=None):
        return self.__return_elements__(locator)[index].size if index is not None else self.__return_element__(
            locator).size

    def get_element_attribute(self, locator, attribute, index=None):
        return self.__return_elements__(locator)[index].get_attribute(
            attribute) if index is not None else self.__return_element__(
            locator).get_attribute(attribute)

    def mouseout_el(self, element):
        js = "var evObj = document.createEvent('MouseEvents');\n" \
             "evObj.initMouseEvent(\"mouseleave\",true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);\n" \
             "arguments[0].dispatchEvent(evObj);"
        self.browser.execute_script(js, element)

    @staticmethod
    def clear_field(el):
        # hack for mac
        for item in [Keys.COMMAND, Keys.CONTROL]:
            el.send_keys(item + 'a')
            el.send_keys(Keys.DELETE)

    def find_element(self, locator, index=None, timeout=10):
        return self.__return_elements__(locator, timeout)[index] if index is not None else self.__return_element__(
            locator,
            timeout)

    def find_elements(self, locator, timeout=10):
        return self.__return_elements__(locator, timeout)

    def find_clickable_element(self, locator, index=None, timeout=10):
        return self.__return_elements__(locator, timeout)[index] if index is not None else self.__return_element__(
            locator,
            timeout)

    def get_css_property(self, locator, css_property):
        el = self.__return_element__(locator)
        return el.value_of_css_property(css_property)
