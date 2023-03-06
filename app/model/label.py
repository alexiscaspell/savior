from app.model.app_model import AppModel
from app.model.service import Service
from typing import List
from typing import Dict

class ServiceLabel(AppModel):
    service: Service
    label: str

    def apply_to_service(self,svc:Service):
        svc.vars.update(self.service.vars)

        new_rules = svc.rules
        current_rule_ids = list(map(lambda r:r.id,svc.rules))

        for rule in self.service.rules:
            if rule.id in current_rule_ids:
                new_rules = list(filter(lambda r:r.id!=rule.id,new_rules))

            new_rules.append(rule)

        return svc
