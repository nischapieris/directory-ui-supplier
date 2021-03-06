from directory_validators import enrolment as shared_enrolment_validators
import phonenumbers

from django import forms


class PaddedCharField(forms.CharField):
    def __init__(self, fillchar, *args, **kwargs):
        self.fillchar = fillchar
        super().__init__(*args, **kwargs)

    def to_python(self, *args, **kwargs):
        value = super().to_python(*args, **kwargs)
        if value not in self.empty_values:
            return value.rjust(self.max_length, self.fillchar)
        return value


class MobilePhoneNumberField(forms.CharField):
    def to_python(self, *args, **kwargs):
        value = super().to_python(*args, **kwargs)
        if value in self.empty_values:
            return value

        # side_effect: can raise a validation error
        shared_enrolment_validators.domestic_mobile_phone_number(value)

        parsed = phonenumbers.parse(value, 'GB')
        return '0{number}'.format(number=parsed.national_number)
