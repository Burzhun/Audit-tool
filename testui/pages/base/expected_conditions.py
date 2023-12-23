from selenium.common.exceptions import NoAlertPresentException


class alert_is_not_present(object):
    """ Expect an alert to not to be present."""

    def __call__(self, driver):
        try:
            alert = driver.switch_to.alert
            alert.text
            return False
        except NoAlertPresentException:
            return True
