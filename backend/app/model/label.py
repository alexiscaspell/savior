from app.model.app_model import AppModel
from app.model.service import Service
from copy import copy
from typing import Optional


class ServiceLabel(AppModel):
    label: str
    # Optional template service: when set, its vars/rules are merged into consumers.
    service: Optional[Service] = None

    def apply_to_service(self, svc: Service):
        # Tag-only label (no template): nothing to inherit.
        if self.service is None or self.service.id is None:
            return svc

        template_vars = dict(self.service.vars or {})
        # Internal marker must not leak into consumers.
        template_vars.pop("__template", None)

        vars_ = copy(template_vars)
        vars_.update(svc.vars or {})
        svc.vars = vars_

        new_rules = svc.rules
        current_rule_ids = list(map(lambda r: r.id, svc.rules or []))

        for rule in self.service.rules or []:
            if rule.id in current_rule_ids:
                continue
            new_rules.append(rule)

        return svc
