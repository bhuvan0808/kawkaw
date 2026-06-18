import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../data/address.dart';
import '../data/address_repository.dart';

final addressRepositoryProvider = Provider<AddressRepository>((ref) {
  return AddressRepository(ref.watch(dioProvider));
});

final addressControllerProvider =
    AsyncNotifierProvider<AddressController, List<Address>>(AddressController.new);

class AddressController extends AsyncNotifier<List<Address>> {
  AddressRepository get _repo => ref.read(addressRepositoryProvider);

  @override
  Future<List<Address>> build() => _repo.list();

  Future<void> _refresh() async {
    state = await AsyncValue.guard(_repo.list);
  }

  Future<Address> create(AddressInput input) async {
    final created = await _repo.create(input);
    await _refresh();
    return created;
  }

  Future<void> updateAddress(String id, AddressInput input) async {
    await _repo.update(id, input);
    await _refresh();
  }

  Future<void> remove(String id) async {
    await _repo.remove(id);
    await _refresh();
  }

  Future<void> setDefault(String id) async {
    await _repo.setDefault(id);
    await _refresh();
  }
}

/// Convenience: the current default address (or first), null when none.
final defaultAddressProvider = Provider<Address?>((ref) {
  final addresses = ref.watch(addressControllerProvider).valueOrNull ?? const [];
  if (addresses.isEmpty) return null;
  return addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);
});
