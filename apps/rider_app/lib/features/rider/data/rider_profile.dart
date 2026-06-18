enum RiderStatus { offline, online, busy }

extension RiderStatusX on RiderStatus {
  String get apiValue => name.toUpperCase();
  static RiderStatus fromApi(String v) => switch (v.toUpperCase()) {
        'ONLINE' => RiderStatus.online,
        'BUSY' => RiderStatus.busy,
        _ => RiderStatus.offline,
      };
}

class RiderProfile {
  const RiderProfile({
    required this.id,
    required this.status,
    required this.isVerified,
    this.vehicleType,
    this.vehicleNumber,
    this.rating = 5,
    this.totalDeliveries = 0,
    this.totalEarnings = 0,
    this.name,
    this.phone,
  });

  final String id;
  final RiderStatus status;
  final bool isVerified;
  final String? vehicleType;
  final String? vehicleNumber;
  final double rating;
  final int totalDeliveries;
  final num totalEarnings;
  final String? name;
  final String? phone;

  bool get isOnline => status == RiderStatus.online || status == RiderStatus.busy;

  factory RiderProfile.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return RiderProfile(
      id: json['id'] as String,
      status: RiderStatusX.fromApi((json['status'] as String?) ?? 'OFFLINE'),
      isVerified: json['isVerified'] as bool? ?? false,
      vehicleType: json['vehicleType'] as String?,
      vehicleNumber: json['vehicleNumber'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 5,
      totalDeliveries: json['totalDeliveries'] as int? ?? 0,
      totalEarnings: json['totalEarnings'] == null ? 0 : num.parse(json['totalEarnings'].toString()),
      name: user?['name'] as String?,
      phone: user?['phone'] as String?,
    );
  }
}

class EarningsSummary {
  const EarningsSummary({
    required this.today,
    required this.week,
    required this.month,
    required this.lifetime,
    required this.rating,
  });

  final EarningsPeriod today;
  final EarningsPeriod week;
  final EarningsPeriod month;
  final EarningsPeriod lifetime;
  final double rating;

  factory EarningsSummary.fromJson(Map<String, dynamic> json) => EarningsSummary(
        today: EarningsPeriod.fromJson(json['today'] as Map<String, dynamic>),
        week: EarningsPeriod.fromJson(json['week'] as Map<String, dynamic>),
        month: EarningsPeriod.fromJson(json['month'] as Map<String, dynamic>),
        lifetime: EarningsPeriod.fromJson(json['lifetime'] as Map<String, dynamic>),
        rating: (json['rating'] as num?)?.toDouble() ?? 5,
      );
}

class EarningsPeriod {
  const EarningsPeriod({required this.earnings, required this.deliveries});
  final num earnings;
  final int deliveries;
  factory EarningsPeriod.fromJson(Map<String, dynamic> json) => EarningsPeriod(
        earnings: num.parse((json['earnings'] ?? 0).toString()),
        deliveries: json['deliveries'] as int? ?? 0,
      );
}
