from app.model.app_model import AppModel
from app.model.service import Service
from copy import copy

class ServiceLabel(AppModel):
    service: Service = None
    label: str

    def apply_to_service(self,svc:Service):
        vars =  copy(self.service.vars)
        vars.update(svc.vars)
        svc.vars = vars

        new_rules = svc.rules
        current_rule_ids = list(map(lambda r:r.id,svc.rules))

        for rule in self.service.rules:
            if rule.id in current_rule_ids:
                continue

            new_rules.append(rule)

        return svc
