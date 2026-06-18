/// Authenticated Kaw Kaw user (customer).
class AppUser {
  const AppUser({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    this.role = 'CUSTOMER',
  });

  final String id;
  final String phone;
  final String? name;
  final String? email;
  final String role;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      name: json['name'] as String?,
      email: json['email'] as String?,
      role: (json['role'] as String?) ?? 'CUSTOMER',
    );
  }

  String get displayName => (name != null && name!.trim().isNotEmpty) ? name! : phone;
}
