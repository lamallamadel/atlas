package com.example.backend.entitlement;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/** Applique {@link RequiresFeature} avant l'appel du contrôleur. */
@Component
public class RequiresFeatureInterceptor implements HandlerInterceptor {

    /** Facultatif : absent dans les tests en tranche web, où l'intercepteur est chargé seul. */
    private final ObjectProvider<EntitlementService> entitlements;

    public RequiresFeatureInterceptor(ObjectProvider<EntitlementService> entitlements) {
        this.entitlements = entitlements;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (handler instanceof HandlerMethod method) {
            RequiresFeature required = requiredFeature(method);
            EntitlementService service = entitlements.getIfAvailable();
            if (required != null && service != null) {
                service.require(required.value());
            }
        }
        return true;
    }

    static RequiresFeature requiredFeature(HandlerMethod method) {
        if (method.hasMethodAnnotation(SkipFeatureCheck.class)) {
            return null;
        }
        RequiresFeature onMethod =
                AnnotatedElementUtils.findMergedAnnotation(
                        method.getMethod(), RequiresFeature.class);
        if (onMethod != null) {
            return onMethod;
        }
        return AnnotatedElementUtils.findMergedAnnotation(
                method.getBeanType(), RequiresFeature.class);
    }
}
