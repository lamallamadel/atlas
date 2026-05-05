/**
 * Alias de typage pour les mocks partiels passés à TestBed avec Vitest.
 * `MockedObject<T>` impose une implémentation complète alors que les specs Angular n'en exposent qu'un sous-ensemble.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AngularVitestPartialMock<T extends object = any> = any;
